'use client';

import {
  useDeferredValue, useEffect, useMemo, useRef
} from 'react';
import { useStore } from '@tanstack/react-form';
import { toast } from 'sonner';

import { useTypedAppFormContext } from '@/hooks/use-app-form';

import { ttsFormOptions } from '../components/text-to-speech-form';
import { useTTSVoices } from '../contexts/tts-voices-contexts';
import {
  detectLanguage, languageName, languageTag, pickVoice, type DetectedLanguage
} from '../lib/language';

export const useDetectedLanguage = () => {
  const form = useTypedAppFormContext(ttsFormOptions);
  // Detection runs on every keystroke, so let typing win over it
  const text = useDeferredValue(useStore(form.store, store => store.values.text));

  return useMemo(() => detectLanguage(text), [text]);
};

// Switches to a voice that natively speaks the text's language when the language or model changes
export const useVoiceLanguageSync = (detected: DetectedLanguage | null) => {
  const form = useTypedAppFormContext(ttsFormOptions);
  const { allVoices } = useTTSVoices();
  const model = useStore(form.store, store => store.values.model);
  const tag = detected?.tags[0];

  // Starts from the loaded state, so a restored generation keeps its voice and a hand-picked voice sticks
  const last = useRef({ tag, model });

  useEffect(() => {
    if (last.current.tag === tag && last.current.model === model) return;
    last.current = { tag, model };

    const voice = pickVoice(allVoices, form.getFieldValue('voiceId'), model, tag);
    if (!voice) return;

    form.setFieldValue('voiceId', voice.id);
    toast.info(`Voice switched to ${voice.name} (${languageName(languageTag(voice.language))})`, { id: 'voice-language-sync' });
  }, [tag, model, allVoices, form]);
};
