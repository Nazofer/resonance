import React from 'react';
import {
  trpc, HydrateClient, prefetch
} from '@/trpc/server';
import { NextPage } from 'next';
import TextToSpeechDetailView from '@/features/text-to-speech/views/text-to-speech-detail-view';

interface Props {
  params: Promise<{ generationId: string }>
}

const TextToSpeechDetailPage: NextPage<Props> = async ({
  params,
}) => {
  const { generationId } = await params;

  prefetch(trpc.generations.getById.queryOptions({ id: generationId }));
  prefetch(trpc.voices.getAll.queryOptions());
  prefetch(trpc.generations.getAll.queryOptions());

  return (
    <HydrateClient>
      <TextToSpeechDetailView generationId={generationId} />
    </HydrateClient>
  );
};

export default TextToSpeechDetailPage;
