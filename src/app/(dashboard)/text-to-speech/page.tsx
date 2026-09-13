import TextToSpeechView from '@/features/text-to-speech/views/text-to-speech-view';
import {
  Metadata,
  NextPage
} from 'next';
import {
  trpc, HydrateClient, prefetch
} from '@/trpc/server';


export const metadata: Metadata = {
  title: 'Text to Speech',
};

interface TextToSpeechPageProps {
  searchParams: Promise<{ text?: string, voiceId?: string }>
}

const TextToSpeechPage: NextPage<TextToSpeechPageProps> = async ({ searchParams }) => {
  const { text, voiceId } = await searchParams;

  prefetch(trpc.voices.getAll.queryOptions());


  return (
    <HydrateClient>
      <TextToSpeechView text={text} voiceId={voiceId} />
    </HydrateClient>
  );
};

export default TextToSpeechPage;
