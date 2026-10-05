import { z } from 'zod';

interface SliderControl<Id extends string> {
  type: 'slider'
  id: Id
  label: string
  leftLabel: string
  rightLabel: string
  min: number
  max: number
  step: number
}

interface SelectControl<Id extends string> {
  type: 'select'
  id: Id
  label: string
  // options sharing a group are listed under that heading; ungrouped ones come first
  options: { value: string, label: string, group?: string }[]
}

export type TtsControl<Id extends string = string> = SliderControl<Id> | SelectControl<Id>;

interface TtsModelConfig<Schema extends z.ZodObject> {
  label: string
  description: string
  // engine clones from the voice clip + its transcript (Voice.transcript)
  requiresTranscript?: boolean
  // can the engine speak this language (BCP 47 primary subtag, e.g. 'uk'); used for text and voices
  supportsLanguage: (tag: string) => boolean
  settingsSchema: Schema
  defaults: z.infer<Schema>
  controls: TtsControl<Extract<keyof z.infer<Schema>, string>>[]
}

// Identity helper: infers each model's settings type so defaults/controls are checked against its schema
const defineTtsModel = <Schema extends z.ZodObject>(config: TtsModelConfig<Schema>) => config;

const chatterbox = defineTtsModel({
  label: 'Chatterbox Turbo',
  description: 'English',
  supportsLanguage: tag => tag === 'en',
  settingsSchema: z.object({
    temperature: z.number().min(0).max(2),
    topP: z.number().min(0).max(1),
    topK: z.number().min(1).max(10000),
    repetitionPenalty: z.number().min(1).max(2),
  }),
  defaults: {
    temperature: 0.8,
    topP: 0.95,
    topK: 1000,
    repetitionPenalty: 1.2,
  },
  controls: [
    {
      type: 'slider',
      id: 'temperature',
      label: 'Creativity',
      leftLabel: 'Consistent',
      rightLabel: 'Expressive',
      min: 0,
      max: 2,
      step: 0.1,
    },
    {
      type: 'slider',
      id: 'topP',
      label: 'Voice Variety',
      leftLabel: 'Stable',
      rightLabel: 'Dynamic',
      min: 0,
      max: 1,
      step: 0.05,
    },
    {
      type: 'slider',
      id: 'topK',
      label: 'Expression Range',
      leftLabel: 'Subtle',
      rightLabel: 'Dramatic',
      min: 1,
      max: 10000,
      step: 100,
    },
    {
      type: 'slider',
      id: 'repetitionPenalty',
      label: 'Natural Flow',
      leftLabel: 'Rhythmic',
      rightLabel: 'Varied',
      min: 1,
      max: 2,
      step: 0.1,
    },
  ],
});

// franc-min languages missing from OmniVoice's docs/languages.md, as BCP 47 tags (the other 67 are supported)
const OMNIVOICE_UNSUPPORTED = new Set(['hms', 'hnj', 'ilo', 'koi', 'mad', 'mag', 'rn', 'su', 'za']);

// OmniVoice language ids (docs/lang_id_name_map.tsv) for the 67 franc-min languages it supports
const OMNIVOICE_LANGUAGE_IDS = [
  'am', 'arb', 'az', 'be', 'bg', 'bho', 'bn', 'bs', 'ceb', 'ckb', 'cs', 'de', 'el', 'en', 'es', 'fa', 'fil',
  'fr', 'fuv', 'gu', 'ha', 'hi', 'hr', 'hu', 'id', 'ig', 'it', 'ja', 'jv', 'kk', 'kn', 'ko', 'ln', 'mai',
  'ml', 'mr', 'ms', 'my', 'nl', 'npi', 'ny', 'pa', 'pl', 'plt', 'ps', 'pt', 'qug', 'ro', 'ru', 'rw', 'si',
  'skr', 'so', 'sr', 'sv', 'sw', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'uz', 'vi', 'yo', 'zh', 'zu',
] as const;

// detected language tag -> OmniVoice id, where they differ
const OMNIVOICE_ID_ALIASES: Record<string, string> = { ar: 'arb', ne: 'npi', mg: 'plt', zlm: 'ms' };

// OmniVoice id for a detected language tag, or null when OmniVoice doesn't know it (it then infers the language)
export const omniVoiceLanguageId = (tag: string | undefined) => {
  if (!tag) return null;
  const id = OMNIVOICE_ID_ALIASES[tag] ?? tag;
  return (OMNIVOICE_LANGUAGE_IDS as readonly string[]).includes(id) ? id : null;
};

// Languages that have built-in voices, listed first in the picker
const VOICE_LANGUAGES = new Set(['uk', 'en', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'ru', 'zh']);

// Intl has no names for these two
const MISSING_NAMES: Partial<Record<string, string>> = { fuv: 'Nigerian Fulfulde', skr: 'Saraiki' };
const englishNames = new Intl.DisplayNames(['en'], { type: 'language' });

// Endonym first so speakers find their language, then the English name: "Українська · Ukrainian"
const languageLabel = (id: string) => {
  const english = MISSING_NAMES[id] ?? englishNames.of(id) ?? id;
  const native = new Intl.DisplayNames([id], { type: 'language', fallback: 'none' }).of(id);
  if (!native || native === id || native.toLowerCase() === english.toLowerCase()) return english;
  return `${native.charAt(0).toLocaleUpperCase(id) + native.slice(1)} · ${english}`;
};

const languageOptions = OMNIVOICE_LANGUAGE_IDS
  .map(id => ({ value: id, label: languageLabel(id), group: VOICE_LANGUAGES.has(id) ? 'Built-in voices' : 'More languages' }))
  .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));

const omnivoice = defineTtsModel({
  label: 'OmniVoice',
  description: 'Multilingual, incl. Ukrainian',
  requiresTranscript: true,
  supportsLanguage: tag => !OMNIVOICE_UNSUPPORTED.has(tag),
  settingsSchema: z.object({
    // 'match' follows the detected text language (resolved server-side), anything else overrides it
    language: z.enum(['match', ...OMNIVOICE_LANGUAGE_IDS]),
    speed: z.number().min(0.5).max(2),
    numStep: z.number().int().min(4).max(64),
    guidanceScale: z.number().min(0).max(5),
  }),
  defaults: {
    language: 'match',
    speed: 1,
    numStep: 32,
    guidanceScale: 2,
  },
  controls: [
    {
      type: 'select',
      id: 'language',
      label: 'Language',
      options: [{ value: 'match', label: 'Match text' }, ...languageOptions],
    },
    {
      type: 'slider',
      id: 'speed',
      label: 'Speed',
      leftLabel: 'Slower',
      rightLabel: 'Faster',
      min: 0.5,
      max: 2,
      step: 0.1,
    },
    {
      type: 'slider',
      id: 'numStep',
      label: 'Quality',
      leftLabel: 'Fast',
      rightLabel: 'Detailed',
      min: 8,
      max: 64,
      step: 8,
    },
    {
      type: 'slider',
      id: 'guidanceScale',
      label: 'Voice Adherence',
      leftLabel: 'Loose',
      rightLabel: 'Strict',
      min: 0,
      max: 4,
      step: 0.25,
    },
  ],
});

export const ttsModels = { chatterbox, omnivoice };

export type TtsModelId = keyof typeof ttsModels;

export const TTS_MODEL_IDS = Object.keys(ttsModels) as TtsModelId[];

export const DEFAULT_TTS_MODEL: TtsModelId = 'chatterbox';

// Ties each model id to its own settings schema (form -> tRPC -> DB JSON -> detail view)
export const ttsModelSettingsSchema = z.discriminatedUnion('model', [
  z.object({ model: z.literal('chatterbox'), settings: chatterbox.settingsSchema }),
  z.object({ model: z.literal('omnivoice'), settings: omnivoice.settingsSchema }),
]);

export type TtsModelSettings = z.infer<typeof ttsModelSettingsSchema>;

export type SettingsOf<M extends TtsModelId> = Extract<TtsModelSettings, { model: M }>['settings'];

export const defaultTtsModelSettings = (model: TtsModelId): TtsModelSettings =>
  ({ model, settings: ttsModels[model].defaults }) as TtsModelSettings;

// Compile-time guard: every registry entry must also be in ttsModelSettingsSchema
true satisfies (TtsModelId extends TtsModelSettings['model'] ? true : false);
