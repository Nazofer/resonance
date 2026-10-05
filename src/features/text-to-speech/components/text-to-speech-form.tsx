'use client';

import {
  useAppForm, useTypedAppFormContext
} from '@/hooks/use-app-form';
import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import {
  DEFAULT_TTS_MODEL, defaultTtsModelSettings, ttsModelSettingsSchema, type TtsModelSettings
} from '../data/tts-models';
import {
  checkLanguage, detectLanguage
} from '../lib/language';

const ttsFormSchema = z.object({
  text: z.string().min(1, 'Please enter some text!'),
  voiceId: z.string().min(1, 'Please select a voice!'),
}).and(ttsModelSettingsSchema);

export type TTSFormValues = z.infer<typeof ttsFormSchema>;

export const defaultTTSFormValues: TTSFormValues = {
  text: '',
  voiceId: '',
  ...defaultTtsModelSettings(DEFAULT_TTS_MODEL),
};

export const ttsFormOptions = formOptions({
  defaultValues: defaultTTSFormValues,
});

interface ModelSettingsSetter {
  setFieldValue: (...args: ['settings', TtsModelSettings['settings']] | ['model', TtsModelSettings['model']]) => void
}

// Settings belong to a model, so both always change together
const setModelSettings = (form: ModelSettingsSetter, value: TtsModelSettings) => {
  form.setFieldValue('settings', value.settings);
  form.setFieldValue('model', value.model);
};

export const useSetModelSettings = () => {
  const form = useTypedAppFormContext(ttsFormOptions);
  return (value: TtsModelSettings) => {
    setModelSettings(form, value);
  };
};


interface TTSFormProps extends React.PropsWithChildren {
  defaultValues?: TTSFormValues
}

const TTSForm: React.FC<TTSFormProps> = ({ defaultValues, children }) => {
  const router = useRouter();
  const trpc = useTRPC();

  const createTTSMutation = useMutation(trpc.generations.create.mutationOptions());

  const form = useAppForm({
    ...ttsFormOptions,
    defaultValues: defaultValues ?? defaultTTSFormValues,
    validators: {
      onSubmit: ttsFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const modelSettings = ttsModelSettingsSchema.parse(value);
      const languageIssue = checkLanguage(detectLanguage(value.text), modelSettings);

      if (languageIssue) {
        const { fix } = languageIssue;
        toast.error(languageIssue.message, fix && {
          action: { label: fix.label, onClick: () => { setModelSettings(formApi, fix.value); } },
        });
        return;
      }

      try {
        const data = await createTTSMutation.mutateAsync({
          text: value.text.trim(),
          voiceId: value.voiceId,
          ...modelSettings,
        });

        toast.success('Audio generated successfully!');
        router.push(`/text-to-speech/${data.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate audio';
        toast.error(message);
      }
    }
  });

  return (
    <form.AppForm>
      {children}
    </form.AppForm>
  );
};

export default TTSForm;
