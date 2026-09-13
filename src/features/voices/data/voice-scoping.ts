// must match the .wav files in scripts/system-voices (gitignored, not checked automatically)
export const SYSTEM_VOICE_NAMES = [
  'Aaron',
  'Abigail',
  'Anaya',
  'Andy',
  'Archer',
  'Brian',
  'Chloe',
  'Dylan',
  'Emmanuel',
  'Ethan',
  'Evelyn',
  'Gavin',
  'Gordon',
  'Ivan',
  'Laura',
  'Lucy',
  'Madison',
  'Marisol',
  'Meera',
  'Walter',
] as const;

export type SystemVoiceName = (typeof SYSTEM_VOICE_NAMES)[number];
