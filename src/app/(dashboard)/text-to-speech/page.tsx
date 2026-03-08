import TextToSpeechView from '@/features/text-to-speech/views/text-to-speech-view';
import {
  Metadata,
  NextPage
} from 'next';

export const metadata: Metadata = {
  title: 'Text to Speech',
};

const TextToSpeechPage: NextPage = () => {
  return <TextToSpeechView />;
};

export default TextToSpeechPage;