'use client';

import { SettingsPanel } from '../components/settings-panel';
import TextInputPanel from '../components/text-input-panel';
import TTSForm, { defaultTTSFormValues } from '../components/text-to-speech-form';
import { VoicePreviewPlaceholder } from '../components/voice-preview-placeholder';

const TextToSpeechView = () => {
  return (
    <TTSForm defaultValues={defaultTTSFormValues}>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col">
          <TextInputPanel />
          <VoicePreviewPlaceholder />
        </div>
        <SettingsPanel />
      </div>
    </TTSForm>
  );
};

export default TextToSpeechView;
