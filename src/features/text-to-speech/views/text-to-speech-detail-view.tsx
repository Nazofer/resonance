'use client';

import { useSuspenseQueries } from '@tanstack/react-query';
import { SettingsPanel } from '../components/settings-panel';
import TextInputPanel from '../components/text-input-panel';
import TTSForm, { TTSFormValues } from '../components/text-to-speech-form';
import { useTRPC } from '@/trpc/client';
import { useMemo } from 'react';
import {
  TTSVoicesContextValue, TTSVoicesProvider
} from '../contexts/tts-voices-contexts';
import { VoicePreviewPanel } from '../components/voice-preview-panel';
import { VoicePreviewMobile } from '../components/voice-preview-panel-mobile';


interface TextToSpeechDetailViewProps {
  generationId: string
}

const TextToSpeechDetailView = ({ generationId }: TextToSpeechDetailViewProps) => {
  const trpc = useTRPC();

  const [
    generationQuery,
    voicesQuery,
  ] = useSuspenseQueries({
    queries: [
      trpc.generations.getById.queryOptions({ id: generationId }),
      trpc.voices.getAll.queryOptions(),
    ]
  });

  const data = generationQuery.data;
  const { custom: customVoices, system: systemVoices } = voicesQuery.data;

  const allVoices = useMemo(() => [...customVoices, ...systemVoices], [customVoices, systemVoices]);

  const fallbackVoiceId = allVoices[0]?.id ?? '';
  const resolvedVoiceId = data.voiceId
    && allVoices.find(voice => voice.id === data.voiceId)
    ? data.voiceId
    : fallbackVoiceId;

  const defaultValues: TTSFormValues = useMemo(() => ({
    text: data.text,
    voiceId: resolvedVoiceId,
    temperature: data.temperature,
    topP: data.topP,
    topK: data.topK,
    repetitionPenalty: data.repetitionPenalty,
  }), [
    data.text,
    resolvedVoiceId,
    data.temperature,
    data.topP,
    data.topK,
    data.repetitionPenalty
  ]);

  const TTSVoicesContextValue: TTSVoicesContextValue = useMemo(() => ({
    allVoices,
    customVoices,
    systemVoices,
  }), [allVoices, customVoices, systemVoices]);

  const generationVoice = {
    id: data.voiceId ?? undefined,
    name: data.voiceName,
  };

  return (
    <TTSVoicesProvider value={TTSVoicesContextValue}>
      <TTSForm
        key={generationId}
        defaultValues={defaultValues}
      >
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            <TextInputPanel />
            <VoicePreviewPanel
              audioUrl={data.audioUrl}
              voice={generationVoice}
              text={data.text}
            />
            <VoicePreviewMobile
              audioUrl={data.audioUrl}
              voice={generationVoice}
              text={data.text}
            />
          </div>
          <SettingsPanel />
        </div>
      </TTSForm>
    </TTSVoicesProvider>
  );
};

export default TextToSpeechDetailView;
