import TextToSpeechLayoutComponent from '@/features/text-to-speech/layouts/text-to-speech-layout';

const TextToSpeechLayout = ({ children }: React.PropsWithChildren) => {
  return <TextToSpeechLayoutComponent>{children}</TextToSpeechLayoutComponent>;
};

export default TextToSpeechLayout;