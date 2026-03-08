import TextInputPanel from '../components/text-input-panel';
import { VoicePreviewPlaceholder } from '../components/voice-preview-placeholder';

const TextToSpeechView = () => {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">
        <TextInputPanel />
        <VoicePreviewPlaceholder />
      </div>
    </div>
  );
};

export default TextToSpeechView;