'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { SettingsPanel } from '../components/settings-panel';
import TextInputPanel from '../components/text-input-panel';
import TTSForm, {
  defaultTTSFormValues, TTSFormValues
} from '../components/text-to-speech-form';
import { VoicePreviewPlaceholder } from '../components/voice-preview-placeholder';
import { useTRPC } from '@/trpc/client';
import { useMemo } from 'react';
import {
  TTSVoicesContextValue, TTSVoicesProvider
} from '../contexts/tts-voices-contexts';


interface TextToSpeechViewProps {
  text?: string
  voiceId?: string
}

const TextToSpeechView = ({ text, voiceId }: TextToSpeechViewProps) => {
  const trpc = useTRPC();

  const { data: voices } = useSuspenseQuery(trpc.voices.getAll.queryOptions());

  const { custom: customVoices, system: systemVoices } = voices;

  const allVoices = useMemo(() => [...customVoices, ...systemVoices], [customVoices, systemVoices]);

  const fallbackVoiceId = allVoices[0]?.id ?? '';
  const resolvedVoiceId = voiceId && allVoices.find(voice => voice.id === voiceId) ? voiceId : fallbackVoiceId;

  const defaultValues: TTSFormValues = useMemo(() => ({
    ...defaultTTSFormValues,
    text: text ?? defaultTTSFormValues.text,
    voiceId: resolvedVoiceId
  }), [text, resolvedVoiceId]);

  const TTSVoicesContextValue: TTSVoicesContextValue = useMemo(() => ({
    allVoices,
    customVoices,
    systemVoices,
  }), [allVoices, customVoices, systemVoices]);

  return (
    <TTSVoicesProvider value={TTSVoicesContextValue}>
      <TTSForm
        defaultValues={defaultValues}
      >
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            <TextInputPanel />
            <VoicePreviewPlaceholder />
          </div>
          <SettingsPanel />
        </div>
      </TTSForm>
    </TTSVoicesProvider>
  );
};

export default TextToSpeechView;
