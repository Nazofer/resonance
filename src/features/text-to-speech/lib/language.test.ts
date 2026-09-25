import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  defaultTtsModelSettings, omniVoiceLanguageId, type TtsModelSettings
} from '../data/tts-models';
import {
  checkLanguage, detectLanguage, pickVoice, voicesForModel
} from './language';

const chatterbox = defaultTtsModelSettings('chatterbox');
const omnivoice = (language: string): TtsModelSettings =>
  ({ model: 'omnivoice', settings: { ...defaultTtsModelSettings('omnivoice').settings, language } }) as TtsModelSettings;

const check = (text: string, current: TtsModelSettings) => checkLanguage(detectLanguage(text), current);

const ENGLISH = 'Hello from Chatterbox, just checking nothing broke.';
const UKRAINIAN = 'Доброго ранку! Сьогодні ми перевіряємо синтез.';
const GERMAN = 'Guten Morgen, wie geht es dir heute?';
const SUNDANESE = 'Sampurasun, kumaha damang? Abdi bade angkat ka pasar.';

void test('supported text passes', () => {
  assert.equal(check(ENGLISH, chatterbox), null);
  assert.equal(check(UKRAINIAN, omnivoice('match')), null);
  assert.equal(check(GERMAN, omnivoice('match')), null);
});

void test('too short to tell is not blocked', () => {
  for (const text of ['Привіт!', 'Hello', 'Thank you', 'Дякую', '']) {
    assert.equal(detectLanguage(text), null, text);
  }
  assert.equal(check('Hello', chatterbox), null);
});

void test('short text in a language with its own script is detected', () => {
  const tags = (text: string) => detectLanguage(text)?.tags[0];
  assert.equal(tags('안녕하세요'), 'ko');
  assert.equal(tags('こんにちは'), 'ja');
  assert.equal(tags('你好'), 'zh');
  assert.equal(tags('Γεια σας'), 'el');
  assert.equal(check('안녕하세요', chatterbox)?.fix?.label, 'Switch to OmniVoice');
});

void test('unsupported model suggests one that speaks the language, following the text', () => {
  const issue = check(UKRAINIAN, chatterbox);
  assert.equal(issue?.fix?.label, 'Switch to OmniVoice');
  assert.deepEqual(issue.fix.value.model, 'omnivoice');
  assert.equal((issue.fix.value.settings as { language: string }).language, 'match');
});

void test('an explicit language override is respected, not flagged', () => {
  assert.equal(check(ENGLISH, omnivoice('uk')), null);
});

void test('detected tags map onto OmniVoice language ids', () => {
  assert.equal(omniVoiceLanguageId('uk'), 'uk');
  assert.equal(omniVoiceLanguageId('ar'), 'arb');
  assert.equal(omniVoiceLanguageId('zlm'), 'ms');
  // unknown to OmniVoice or nothing detected: let it infer the language
  assert.equal(omniVoiceLanguageId('su'), null);
  assert.equal(omniVoiceLanguageId(undefined), null);
});

void test('language no model speaks has no fix', () => {
  const issue = check(SUNDANESE, chatterbox);
  assert.match(issue?.message ?? '', /isn't supported by any available model/);
  assert.equal(issue?.fix, undefined);
});

const voices = [
  { id: 'aaron', language: 'en-US' },
  { id: 'ivan', language: 'ru-RU' },
  { id: 'lada', language: 'uk-UA' },
  { id: 'mykyta', language: 'uk-UA' },
];

void test('pickVoice keeps a voice that already fits', () => {
  assert.equal(pickVoice(voices, 'mykyta', 'omnivoice', 'uk'), null);
  assert.equal(pickVoice(voices, 'aaron', 'chatterbox', 'en'), null);
  // nothing detected yet
  assert.equal(pickVoice(voices, 'aaron', 'omnivoice', undefined), null);
  // no voice speaks German: keep the current usable one
  assert.equal(pickVoice(voices, 'lada', 'omnivoice', 'de'), null);
});

void test('pickVoice switches to a native voice for the text language', () => {
  assert.equal(pickVoice(voices, 'aaron', 'omnivoice', 'uk')?.id, 'lada');
  assert.equal(pickVoice(voices, 'lada', 'omnivoice', 'ru')?.id, 'ivan');
});

void test('pickVoice only offers voices the model can speak', () => {
  // Chatterbox is English-only: a Ukrainian voice gets replaced even for Ukrainian text
  assert.equal(pickVoice(voices, 'lada', 'chatterbox', 'uk')?.id, 'aaron');
  assert.deepEqual(voicesForModel(voices, 'chatterbox').map(v => v.id), ['aaron']);
});
