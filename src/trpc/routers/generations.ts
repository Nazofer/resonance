import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
// import { polar } from '@/lib/polar';
// import { env } from '@/lib/env';
import { TRPCError } from '@trpc/server';
import { chatterbox } from '@/lib/chatterbox-client';
import { prisma } from '@/lib/db';
import { uploadAudio } from '@/lib/r2';
import { TEXT_MAX_LENGTH } from '@/features/text-to-speech/data/constants';
import {
  createTRPCRouter, orgProcedure
} from '../init';
import { noop } from '@tanstack/react-query';

export const generationsRouter = createTRPCRouter({
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const generation = await prisma.generation.findUnique({
        where: { id: input.id, orgId: ctx.orgId },
        omit: {
          orgId: true,
          r2ObjectKey: true,
        },
      });

      if (!generation) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return {
        ...generation,
        audioUrl: `/api/audio/${generation.id}`,
      };
    }),

  getAll: orgProcedure.query(async ({ ctx }) => {
    const generations = await prisma.generation.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: 'desc' },
      omit: {
        orgId: true,
        r2ObjectKey: true,
      },
    });

    return generations;
  }),

  create: orgProcedure
    .input(
      z.object({
        text: z.string().min(1).max(TEXT_MAX_LENGTH),
        voiceId: z.string().min(1),
        temperature: z.number().min(0).max(2).default(0.8),
        topP: z.number().min(0).max(1).default(0.95),
        topK: z.number().min(1).max(10000).default(1000),
        repetitionPenalty: z.number().min(1).max(2).default(1.2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check for active subscription before generation
      try {
        // const customerState = await polar.customers.getStateExternal({
        //   externalId: ctx.orgId,
        // });
        // const hasActiveSubscription
        //   = (customerState.activeSubscriptions ?? []).length > 0;
        const hasActiveSubscription = true;
        // eslint-disable-next-line
        if (!hasActiveSubscription) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'SUBSCRIPTION_REQUIRED',
          });
        }
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        // Customer doesn't exist in Polar yet -> no subscription
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'SUBSCRIPTION_REQUIRED',
        });
      }

      const voice = await prisma.voice.findUnique({
        where: {
          id: input.voiceId,
          OR: [
            { variant: 'SYSTEM' },
            { variant: 'CUSTOM', orgId: ctx.orgId }
          ],
        },
        select: {
          id: true,
          name: true,
          r2ObjectKey: true,
        },
      });

      if (!voice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Voice not found',
        });
      }

      if (!voice.r2ObjectKey) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Voice audio not available',
        });
      }

      Sentry.logger.info('Generation started', {
        orgId: ctx.orgId,
        voiceId: input.voiceId,
        textLength: input.text.length,
      });

      const { data, error, response } = await chatterbox.POST('/generate', {
        body: {
          prompt: input.text,
          voice_key: voice.r2ObjectKey,
          temperature: input.temperature,
          top_p: input.topP,
          top_k: input.topK,
          repetition_penalty: input.repetitionPenalty,
          norm_loudness: true,
        },
        parseAs: 'arrayBuffer',
      });

      if (error) {
        // Chatterbox returns { detail } with the underlying exception
        Sentry.logger.error('Chatterbox generation failed', {
          orgId: ctx.orgId,
          voiceId: input.voiceId,
          status: response.status,
          detail: JSON.stringify(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate audio',
          cause: new Error(`Chatterbox ${response.status}: ${JSON.stringify(error)}`),
        });
      }

      if (!(data instanceof ArrayBuffer)) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid audio response',
        });
      }

      const buffer = Buffer.from(data);
      let generationId: string | null = null;
      let r2ObjectKey: string | null = null;

      try {
        const generation = await prisma.generation.create({
          data: {
            orgId: ctx.orgId,
            text: input.text,
            voiceName: voice.name,
            voiceId: voice.id,
            temperature: input.temperature,
            topP: input.topP,
            topK: input.topK,
            repetitionPenalty: input.repetitionPenalty,
          },
          select: {
            id: true,
          },
        });

        generationId = generation.id;
        r2ObjectKey = `generations/orgs/${ctx.orgId}/${generation.id}`;

        await uploadAudio({ buffer, key: r2ObjectKey });

        await prisma.generation.update({
          where: {
            id: generation.id,
          },
          data: {
            r2ObjectKey,
          },
        });

        Sentry.logger.info('Audio generated', {
          orgId: ctx.orgId,
          generationId: generation.id,
        });
      } catch (err) {
        if (generationId) {
          await prisma.generation
            .delete({
              where: {
                id: generationId,
              },
            })
            .catch(noop);
        }

        Sentry.logger.error('Generation failed', {
          orgId: ctx.orgId,
          voiceId: input.voiceId,
          generationId,
          error: err instanceof Error ? err.message : String(err),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to store generated audio',
          cause: err,
        });
      }

      if (!generationId || !r2ObjectKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to store generated audio',
        });
      }

      // Ingest usage event to Polar (fire-and-forget, don't block response)
      // polar.events
      //   .ingest({
      //     events: [
      //       {
      //         name: env.POLAR_METER_TTS_GENERATION,
      //         externalCustomerId: ctx.orgId,
      //         metadata: { [env.POLAR_METER_TTS_PROPERTY]: input.text.length },
      //         timestamp: new Date(),
      //       },
      //     ],
      //   })
      //   .catch(noop);

      return {
        id: generationId,
      };
    }),
});
