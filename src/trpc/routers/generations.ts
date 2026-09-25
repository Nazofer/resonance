import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
// import { polar } from '@/lib/polar';
// import { env } from '@/lib/env';
import { TRPCError } from '@trpc/server';
import { synthesize } from '@/lib/tts';
import { prisma } from '@/lib/db';
import { uploadAudio } from '@/lib/r2';
import { TEXT_MAX_LENGTH } from '@/features/text-to-speech/data/constants';
import {
  ttsModels, ttsModelSettingsSchema
} from '@/features/text-to-speech/data/tts-models';
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
      }).and(ttsModelSettingsSchema)
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
          transcript: true,
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

      if (ttsModels[input.model].requiresTranscript && !voice.transcript) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'This voice has no transcript yet, which the selected model needs',
        });
      }

      Sentry.logger.info('Generation started', {
        orgId: ctx.orgId,
        voiceId: input.voiceId,
        model: input.model,
        textLength: input.text.length,
      });

      let audio: ArrayBuffer;

      try {
        audio = await synthesize(input.model, {
          text: input.text,
          voiceKey: voice.r2ObjectKey,
          voiceTranscript: voice.transcript,
          settings: input.settings,
        });
      } catch (err) {
        Sentry.logger.error('TTS generation failed', {
          orgId: ctx.orgId,
          voiceId: input.voiceId,
          model: input.model,
          detail: err instanceof Error ? err.message : String(err),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate audio',
          cause: err,
        });
      }

      const buffer = Buffer.from(audio);
      let generationId: string | null = null;
      let r2ObjectKey: string | null = null;

      try {
        const generation = await prisma.generation.create({
          data: {
            orgId: ctx.orgId,
            text: input.text,
            voiceName: voice.name,
            voiceId: voice.id,
            model: input.model,
            settings: input.settings,
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
