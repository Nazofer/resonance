import { francAll } from 'franc-min';

import {
  defaultTtsModelSettings, TTS_MODEL_IDS, ttsModels,
  type TtsModelId, type TtsModelSettings
} from '../data/tts-models';

// Short text often ties close languages (spa/por, rus/srp): every guess this close to the best one is plausible
const PLAUSIBLE_SCORE = 0.9;

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

// Primary BCP 47 subtag, the shared language key for text, voices and engines: ukr -> uk, uk-UA -> uk
export const languageTag = (language: string) => Intl.getCanonicalLocales(language)[0].split('-')[0];

export const languageName = (tag: string) => languageNames.of(tag) ?? tag;

export interface DetectedLanguage {
  // display name of the best guess
  name: string
  // plausible language tags, best guess first
  tags: string[]
}

// Below this length franc's trigram guesses are noise ("Hello" -> Somali)
const MIN_TEXT_LENGTH = 10;

export const detectLanguage = (text: string): DetectedLanguage | null => {
  const candidates = francAll(text, { minLength: 1 });

  // franc returns 'und' for empty or letterless text
  if (candidates[0][0] === 'und') return null;
  // Short text: trust franc only when it is unambiguous (Hangul, Kana, Han, Greek, Thai… give a single candidate)
  if (text.length < MIN_TEXT_LENGTH && candidates.length > 1) return null;

  const codes = candidates
    .filter(([, score]) => score >= PLAUSIBLE_SCORE)
    .map(([code]) => code);

  const tags = [...new Set(codes.map(languageTag))];
  return { tags, name: languageName(tags[0]) };
};

export interface LanguageIssue {
  message: string
  fix?: {
    label: string
    value: TtsModelSettings
  }
}

export const checkLanguage = (detected: DetectedLanguage | null, current: TtsModelSettings): LanguageIssue | null => {
  if (!detected) return null;

  const { tags } = detected;
  const supports = (model: TtsModelId) => tags.some(ttsModels[model].supportsLanguage);

  if (!supports(current.model)) {
    const alternative = TTS_MODEL_IDS.find(supports);

    if (!alternative) {
      return { message: `${detected.name} isn't supported by any available model` };
    }

    return {
      message: `${ttsModels[current.model].label} doesn't support ${detected.name}`,
      fix: {
        label: `Switch to ${ttsModels[alternative].label}`,
        value: defaultTtsModelSettings(alternative),
      },
    };
  }

  return null;
};

interface LanguageVoice {
  id: string
  language: string
}

export const voicesForModel = <V extends LanguageVoice>(voices: V[], model: TtsModelId) =>
  voices.filter(voice => ttsModels[model].supportsLanguage(languageTag(voice.language)));

// Voice to switch to so it speaks the text's language natively, or null to keep the current one
export const pickVoice = <V extends LanguageVoice>(
  voices: V[], currentId: string, model: TtsModelId, tag: string | undefined,
): V | null => {
  const usable = voicesForModel(voices, model);
  const current = usable.find(voice => voice.id === currentId);
  const native = usable.filter(voice => languageTag(voice.language) === tag);

  if (current && (!tag || native.length === 0 || native.includes(current))) return null;

  return native.at(0) ?? usable.at(0) ?? null;
};
