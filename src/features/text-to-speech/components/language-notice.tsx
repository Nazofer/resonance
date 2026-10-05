'use client';

import { useStore } from '@tanstack/react-form';
import { Languages } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTypedAppFormContext } from '@/hooks/use-app-form';

import type { TtsModelSettings } from '../data/tts-models';
import {
  useDetectedLanguage, useVoiceLanguageSync
} from '../hooks/use-language';
import { checkLanguage } from '../lib/language';
import {
  ttsFormOptions, useSetModelSettings
} from './text-to-speech-form';

const LanguageNotice = () => {
  const form = useTypedAppFormContext(ttsFormOptions);
  const setModelSettings = useSetModelSettings();

  const detected = useDetectedLanguage();
  useVoiceLanguageSync(detected);

  const model = useStore(form.store, store => store.values.model);
  const settings = useStore(form.store, store => store.values.settings);
  const isSubmitting = useStore(form.store, store => store.isSubmitting);

  if (!detected) return null;

  const issue = checkLanguage(detected, { model, settings } as TtsModelSettings);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" role="status">
      <Badge variant={issue ? 'destructive' : 'outline'} className="gap-1.5 border-dashed">
        <Languages className="size-3" />
        {detected.name}
      </Badge>
      {issue && (
        <>
          <span className="text-destructive">{issue.message}</span>
          {issue.fix && (
            <Button
              size="xs"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => { if (issue.fix) setModelSettings(issue.fix.value); }}
            >
              {issue.fix.label}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default LanguageNotice;
