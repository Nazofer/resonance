import createClient from 'openapi-fetch';
import type { paths as ChatterboxPaths } from '@/types/chatterbox-api';
import type { paths as OmniVoicePaths } from '@/types/omnivoice-api';
import {
  omniVoiceLanguageId, type SettingsOf, type TtsModelId
} from '@/features/text-to-speech/data/tts-models';
import { detectLanguage } from '@/features/text-to-speech/lib/language';
import { env } from './env';

// One shared key for all engines, split into per-engine keys if they get separate secrets
const headers = { 'x-api-key': env.CHATTERBOX_API_KEY };

const chatterbox = createClient<ChatterboxPaths>({ baseUrl: env.CHATTERBOX_API_URL, headers });
const omnivoice = createClient<OmniVoicePaths>({ baseUrl: env.OMNIVOICE_API_URL, headers });

interface SynthesizeInput<M extends TtsModelId> {
  text: string
  voiceKey: string
  voiceTranscript: string | null
  settings: SettingsOf<M>
}

interface FetchResult {
  data?: unknown
  error?: unknown
  response: Response
}

const toAudio = (engine: string, { data, error, response }: FetchResult): ArrayBuffer => {
  // Engines return { detail } with the underlying exception
  if (error) throw new Error(`${engine} ${response.status}: ${JSON.stringify(error)}`);
  if (!(data instanceof ArrayBuffer)) throw new Error(`${engine}: invalid audio response`);
  return data;
};

// Adapters: map app-level settings to each engine's native request body
const synthesizers: { [M in TtsModelId]: (input: SynthesizeInput<M>) => Promise<ArrayBuffer> } = {
  chatterbox: async ({ text, voiceKey, settings }) => toAudio('Chatterbox', await chatterbox.POST('/generate', {
    body: {
      prompt: text,
      voice_key: voiceKey,
      temperature: settings.temperature,
      top_p: settings.topP,
      top_k: settings.topK,
      repetition_penalty: settings.repetitionPenalty,
      norm_loudness: true,
    },
    parseAs: 'arrayBuffer',
  })),

  omnivoice: async ({ text, voiceKey, voiceTranscript, settings }) => {
    if (!env.OMNIVOICE_API_URL) throw new Error('OmniVoice: OMNIVOICE_API_URL is not configured');
    if (!voiceTranscript) throw new Error('OmniVoice: voice has no transcript');

    return toAudio('OmniVoice', await omnivoice.POST('/generate', {
      body: {
        prompt: text,
        voice_key: voiceKey,
        ref_text: voiceTranscript,
        language: settings.language === 'match' ? omniVoiceLanguageId(detectLanguage(text)?.tags[0]) : settings.language,
        speed: settings.speed,
        num_step: settings.numStep,
        guidance_scale: settings.guidanceScale,
      },
      parseAs: 'arrayBuffer',
    }));
  },
};

export const synthesize = <M extends TtsModelId>(model: M, input: SynthesizeInput<M>) =>
  synthesizers[model](input);
