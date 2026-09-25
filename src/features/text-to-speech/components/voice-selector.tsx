'use client';

import { useState } from 'react';
import { useStore } from '@tanstack/react-form';

import { VOICE_CATEGORY_LABELS } from '@/features/voices/data/voice-categories';
import {
  Field, FieldLabel
} from '@/components/ui/field';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useTypedAppFormContext } from '@/hooks/use-app-form';
import { VoiceAvatar } from '@/components/voice-avatar/voice-avatar';
import { useTTSVoices } from '@/features/text-to-speech/contexts/tts-voices-contexts';
import { ttsFormOptions } from './text-to-speech-form';


const VoiceSelector = () => {
  const { customVoices, systemVoices, allVoices } = useTTSVoices();

  const form = useTypedAppFormContext(ttsFormOptions);

  const voiceId = useStore(form.store, state => state.values.voiceId);
  const isSubmitting = useStore(form.store, state => state.isSubmitting);
  // Modal drawer blocks pointer events outside itself, so portal the popup into it when nested
  const [portalContainer, setPortalContainer] = useState<HTMLElement>();

  const selectedVoice = allVoices.find(voice => voice.id === voiceId);
  const hasMissingSelectedVoice = !!voiceId && !selectedVoice;
  const currentVoice = selectedVoice ? selectedVoice : hasMissingSelectedVoice ? {
    id: voiceId,
    name: 'Unknown Voice',
    category: null
  } : allVoices[0];

  return (
    <Field>
      <FieldLabel>Voice style</FieldLabel>
      <Select
        value={voiceId}
        onValueChange={(value) => { if (value) form.setFieldValue('voiceId', value); }}
        disabled={isSubmitting}
      >
        <SelectTrigger
          ref={(el: HTMLElement | null) => { setPortalContainer(el?.closest<HTMLElement>('[data-slot="drawer-content"]') ?? undefined); }}
          className="h-auto w-full gap-1 rounded-lg bg-white px-2 py-1"
        >
          <SelectValue>
            <>
              <VoiceAvatar seed={currentVoice.id} name={currentVoice.name} />
              <span className="truncate text-sm font-medium tracking-tight">
                {currentVoice.name}
                {currentVoice.category && ` - ${VOICE_CATEGORY_LABELS[currentVoice.category]}`}
              </span>
            </>
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} container={portalContainer}>
          {hasMissingSelectedVoice && (
            <>
              <SelectGroup>
                <SelectLabel>
                  Selected voice
                </SelectLabel>
                <SelectItem value={currentVoice.id}>
                  <VoiceAvatar seed={currentVoice.id} name={currentVoice.name} />
                  <span className="truncate text-sm font-medium tracking-tight">
                    {currentVoice.name}
                    {currentVoice.category && ` - ${VOICE_CATEGORY_LABELS[currentVoice.category]}`}
                  </span>
                </SelectItem>
              </SelectGroup>
              {(customVoices.length > 0) && systemVoices.length > 0 && (
                <SelectSeparator />
              )}
            </>
          )}
          {customVoices.length > 0 && (
            <>
              <SelectGroup>
                <SelectLabel>
                  Custom voices
                </SelectLabel>
                {customVoices.map(voice => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <VoiceAvatar seed={voice.id} name={voice.name} />
                    <span className="truncate text-sm font-medium tracking-tight">
                      {voice.name}
                      {` - ${VOICE_CATEGORY_LABELS[voice.category]}`}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
          {customVoices.length > 0 && systemVoices.length > 0 && (
            <SelectSeparator />
          )}
          {systemVoices.length > 0 && (
            <>
              <SelectGroup>
                <SelectLabel>
                  Built-in voices
                </SelectLabel>
                {systemVoices.map(voice => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <VoiceAvatar seed={voice.id} name={voice.name} />
                    <span className="truncate text-sm font-medium tracking-tight">
                      {voice.name}
                      {` - ${VOICE_CATEGORY_LABELS[voice.category]}`}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </Field>
  );
};

export default VoiceSelector;
