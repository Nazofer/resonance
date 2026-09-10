'use client';

import { useAppForm } from '@/hooks/use-app-form';
import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';

const ttsFormSchema = z.object({
  text: z.string().min(1, 'Please enter some text!'),
  voiceId: z.string().min(1, 'Please select a voice!'),
  topP: z.number(),
  topK: z.number(),
  temperature: z.number(),
  repetitionPenalty: z.number(),
});

export type TTSFormValues = z.infer<typeof ttsFormSchema>;

export const defaultTTSFormValues: TTSFormValues = {
  text: '',
  voiceId: '',
  temperature: 0.8,
  topP: 0.95,
  topK: 1000,
  repetitionPenalty: 1.2,
};

export const ttsFormOptions = formOptions({
  defaultValues: defaultTTSFormValues,
});


interface TTSFormProps extends React.PropsWithChildren {
  defaultValues?: TTSFormValues
}

const TTSForm: React.FC<TTSFormProps> = ({ defaultValues, children }) => {
  const form = useAppForm({
    ...ttsFormOptions,
    defaultValues: defaultValues ?? defaultTTSFormValues,
    validators: {
      onSubmit: ttsFormSchema,
    },
    onSubmit: async () => {
      //asd
    }
  });

  return (
    <form.AppForm>
      {children}
    </form.AppForm>
  );
};

export default TTSForm;
