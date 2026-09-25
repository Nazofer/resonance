'use client';

import { useAppForm } from '@/hooks/use-app-form';
import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

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
  const router = useRouter();
  const trpc = useTRPC();

  const createTTSMutation = useMutation(trpc.generations.create.mutationOptions());

  const form = useAppForm({
    ...ttsFormOptions,
    defaultValues: defaultValues ?? defaultTTSFormValues,
    validators: {
      onSubmit: ttsFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const data = await createTTSMutation.mutateAsync({
          text: value.text.trim(),
          voiceId: value.voiceId,
          temperature: value.temperature,
          topP: value.topP,
          topK: value.topK,
          repetitionPenalty: value.repetitionPenalty,
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
