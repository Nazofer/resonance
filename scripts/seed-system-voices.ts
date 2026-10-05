import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';

import {
  PrismaClient,
  type VoiceCategory,
} from '../src/generated/prisma/client';

import {
  SYSTEM_VOICE_NAMES,
  type SystemVoiceName,
} from '../src/features/voices/data/voice-scoping';
import { noop } from '@tanstack/react-query';

const SYSTEM_VOICES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'system-voices',
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
});

const env = envSchema.parse(process.env);

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

interface VoiceMetadata {
  description: string
  category: VoiceCategory
  language: string
  // must match the .wav exactly (OmniVoice aligns audio to it); re-transcribe if a clip changes
  transcript: string
}

const systemVoiceMetadata: Record<SystemVoiceName, VoiceMetadata> = {
  Aaron: {
    description: 'Soothing and calm, like a self-help audiobook narrator',
    category: 'AUDIOBOOK',
    language: 'en-US',
    transcript:
      'Just as surfers wait for the perfect wave, we must be patient as we learn new things.',
  },
  Abigail: {
    description: 'Friendly and conversational with a warm, approachable tone',
    category: 'CONVERSATIONAL',
    language: 'en-GB',
    transcript:
      'Hello, my name is Jess. I love people and good conversations. What do you feel like talking about today?',
  },
  Anaya: {
    description: 'Polite and professional, suited for customer service',
    category: 'CUSTOMER_SERVICE',
    language: 'en-IN',
    transcript:
      'Hello sir, I\'m Savi from ATX Health Insurance. How can I support you with your health coverage today?',
  },
  Andy: {
    description: 'Versatile and clear, a reliable all-purpose narrator',
    category: 'GENERAL',
    language: 'en-US',
    transcript:
      'Dreams are made stronger when forged in the fire of honor. Imagination is the wind under the wings of growth. Literature paints vibrant worlds of imagination, like a zebra\'s stripes on a sunlit field. Poetry is like a gentle wave washing over our hearts.',
  },
  Archer: {
    description: 'Laid-back and reflective with a steady, storytelling pace',
    category: 'NARRATIVE',
    language: 'en-US',
    transcript:
      'The best journeys answer questions you didn\'t even know to ask. Every journey starts with a single pedal stroke.',
  },
  Brian: {
    description: 'Professional and helpful with a clear customer support tone',
    category: 'CUSTOMER_SERVICE',
    language: 'en-US',
    transcript:
      'Hi there, you\'ve reached Acme Corp. How may I help you? Sure, your confirmation code is AZ5375Y and the phone number on file is 877-555-1973.',
  },
  Chloe: {
    description: 'Bright and bubbly with a cheerful, outgoing personality',
    category: 'CORPORATE',
    language: 'en-AU',
    transcript:
      'Hey there, Kayleigh here, your go-to for all things sales and Friday night work drinks, bringing a smile and some serious results.',
  },
  Dylan: {
    description:
      'Thoughtful and intimate, like a quiet late-night conversation',
    category: 'GENERAL',
    language: 'en-US',
    transcript:
      'Life\'s messy, weird, and pretty amazing. Let\'s talk about it. No filters, just real words and real moments.',
  },
  Emmanuel: {
    description: 'Nasally and distinctive with a quirky, cartoon-like quality',
    category: 'CHARACTERS',
    language: 'en-US',
    transcript:
      'My bunny\'s name is Oscar. He is white and fluffy. I love to cuddle him and play games with him in the yard.',
  },
  Ethan: {
    description: 'Polished and warm with crisp, studio-quality delivery',
    category: 'VOICEOVER',
    language: 'en-US',
    transcript:
      'Let me bring your script to life, with clarity, warmth, and just the right touch of enthusiasm.',
  },
  Evelyn: {
    description: 'Warm Southern charm with a heartfelt, down-to-earth feel',
    category: 'CONVERSATIONAL',
    language: 'en-US',
    transcript:
      'Hey y\'all, wanna know a secret? You are awesome. Don\'t let no one tell you different. I love you like a cricket loves chirping. I mean it.',
  },
  Gavin: {
    description: 'Calm and reassuring with a smooth, natural flow',
    category: 'MEDITATION',
    language: 'en-US',
    transcript:
      'The right voice doesn\'t compete for attention. It earns it with tone, timing, and a sense of something more.',
  },
  Gordon: {
    description: 'Warm and encouraging with an uplifting, motivational tone',
    category: 'MOTIVATIONAL',
    language: 'en-US',
    transcript:
      'Even the smallest steps create ripples of happiness. Keep moving forward and let your light shine.',
  },
  Ivan: {
    description: 'Deep and cinematic with a dramatic, movie-character presence',
    category: 'CHARACTERS',
    language: 'ru-RU',
    transcript:
      'Морщины должны просто показывать, где была улыбка.',
  },
  Laura: {
    description: 'Authentic and warm with a conversational Midwestern tone',
    category: 'CONVERSATIONAL',
    language: 'en-US',
    transcript:
      'My name is Kerrigan and I have an American Scottish voice from the Midwest. My voice is authentic, warm, conversational, and Native English.',
  },
  Lucy: {
    description: 'Direct and composed with a professional phone manner',
    category: 'CUSTOMER_SERVICE',
    language: 'en-US',
    transcript:
      'Got it. Thank you for sharing that. So to give you more info about lower monthly payment options, could you tell me how much you owe on all your credit cards combined? Just a ballpark figure like $10,000, $20,000, $25,000, $30,000 or maybe more?',
  },
  Madison: {
    description: 'Energetic and unfiltered with a casual, chatty vibe',
    category: 'PODCAST',
    language: 'en-US',
    transcript:
      'Anyways, hi guys. Welcome back to Extra Dirty. This week\'s episode is going to be part two. We\'re going to be talking about how much we love Graydon, my warped relationship philosophies. We talked on a lot of things in this episode. It\'s going to be really silly. It\'s going to be part two from last week\'s. And let\'s fucking rip it. You guys are going to be obsessed with it.',
  },
  Marisol: {
    description: 'Confident and polished with a persuasive, ad-ready delivery',
    category: 'ADVERTISING',
    language: 'en-US',
    transcript:
      'We know how easy it is to stay stuck in survival mode. That\'s why we show you how to use AI as a creative co-pilot.',
  },
  Meera: {
    description: 'Friendly and helpful with a clear, service-oriented tone',
    category: 'CUSTOMER_SERVICE',
    language: 'en-IN',
    transcript:
      'Thank you for using Eleven Labs. I am Annika, your new customer service agent. Happy to help you.',
  },
  Walter: {
    description: 'Old and raspy with deep gravitas, like a wise grandfather',
    category: 'NARRATIVE',
    language: 'en-US',
    transcript:
      'Let me tell you what my grandpa told me when I was just six years old. Son, always speak the truth. People will never forget what you say.',
  },
  // Ukrainian: speech-uk/opentts-<name> on Hugging Face (Kateryna CC-BY-NC-4.0, others Apache-2.0),
  // one 6-8 s narration clip per speaker (train split row noted below), transcript as published
  Lada: {
    // opentts-lada row 4469 (apache-2.0)
    description: 'Ukrainian female narrator, studio audiobook recording',
    category: 'AUDIOBOOK',
    language: 'uk-UA',
    transcript:
      'Назвіть потрібних вам підмайстрів і вкажіть, які інструменти треба принести.',
  },
  Tetiana: {
    // opentts-tetiana row 3862 (apache-2.0)
    description: 'Ukrainian female narrator, studio audiobook recording',
    category: 'NARRATIVE',
    language: 'uk-UA',
    transcript:
      'Служба теж відбирала в них багато дорогоцінного часу, що спливав непомітно.',
  },
  Kateryna: {
    // opentts-kateryna row 1792 (cc-by-nc-4.0)
    description: 'Ukrainian female narrator, studio audiobook recording',
    category: 'AUDIOBOOK',
    language: 'uk-UA',
    transcript:
      'Коні здихали, і люди поверталися до берега, щоб купувати нових коней.',
  },
  Mykyta: {
    // opentts-mykyta row 5965 (apache-2.0)
    description: 'Ukrainian male narrator, studio audiobook recording',
    category: 'NARRATIVE',
    language: 'uk-UA',
    transcript:
      'Вірю в твою вірність і щирість, що ти не обвинуватиш і не будеш пошукувати мене.',
  },
  Oleksa: {
    // opentts-oleksa row 853 (apache-2.0)
    description: 'Ukrainian male narrator, studio audiobook recording',
    category: 'AUDIOBOOK',
    language: 'uk-UA',
    transcript:
      'Атос жестом наказав Портосу й Арамісу не рухатись і під\'їхав до нього сам.',
  },
  // Other languages: google/fleurs on Hugging Face (CC-BY-4.0, Conneau et al. 2022), one read-speech clip
  // per speaker picked for exact Whisper agreement with the transcript and a clean recording (SNR)
  Anna: {
    // fleurs de_de/train 4218598733355248523.wav
    description: 'German female voice, clear read speech',
    category: 'GENERAL',
    language: 'de-DE',
    transcript:
      'Stellen Sie sicher, dass Sie wissen, was Sie einführen können und was nicht, und geben Sie alles an, was über die gesetzlichen Grenzen hinausgeht.',
  },
  Lukas: {
    // fleurs de_de/dev 2451196745503996684.wav
    description: 'German male voice, clear read speech',
    category: 'GENERAL',
    language: 'de-DE',
    transcript:
      'Er sagte, dass er eine WLAN-Türklingel gebaut habe.',
  },
  Camille: {
    // fleurs fr_fr/dev 10587796381228744557.wav
    description: 'French female voice, clear read speech',
    category: 'GENERAL',
    language: 'fr-FR',
    transcript:
      'L\'Amazone est également le fleuve le plus large de la planète, atteignant parfois 10 km de large.',
  },
  Julien: {
    // fleurs fr_fr/dev 15486459632428455015.wav
    description: 'French male voice, clear read speech',
    category: 'GENERAL',
    language: 'fr-FR',
    transcript:
      'Cela vaut la peine de se promener pendant une demi-heure dans ce village fascinant.',
  },
  Lucia: {
    // fleurs es_419/dev 6153923534060353431.wav
    description: 'Latin American Spanish female voice, clear read speech',
    category: 'GENERAL',
    language: 'es-419',
    transcript:
      'El cristianismo ortodoxo es la religión mayoritaria en Moldavia.',
  },
  Mateo: {
    // fleurs es_419/dev 12832763676170496221.wav
    description: 'Latin American Spanish male voice, clear read speech',
    category: 'GENERAL',
    language: 'es-419',
    transcript:
      'El cristianismo ortodoxo es la religión mayoritaria en Moldavia.',
  },
  Giulia: {
    // fleurs it_it/dev 14780160000188802638.wav
    description: 'Italian female voice, clear read speech',
    category: 'GENERAL',
    language: 'it-IT',
    transcript:
      'Nella terra di Canaan non c\'erano grandi foreste, per cui il legno era particolarmente costoso.',
  },
  Marco: {
    // fleurs it_it/test 8646216597303794244.wav
    description: 'Italian male voice, clear read speech',
    category: 'GENERAL',
    language: 'it-IT',
    transcript:
      'Mentre prestava servizio all\'ospedale, nel tempo libero Liggins iniziò a studiare i casi di travaglio prematuro.',
  },
  Zofia: {
    // fleurs pl_pl/dev 6876347035317342980.wav
    description: 'Polish female voice, clear read speech',
    category: 'GENERAL',
    language: 'pl-PL',
    transcript:
      'ONZ liczy na utworzenie funduszu pomocowego dla krajów, które zmuszone są reagować na skutki globalnego ocieplenia.',
  },
  Jakub: {
    // fleurs pl_pl/dev 12251322188293877093.wav
    description: 'Polish male voice, clear read speech',
    category: 'GENERAL',
    language: 'pl-PL',
    transcript:
      'Kurs zwykle obejmuje wszystkie omówione tu kwestie, dużo bardziej szczegółowo i w połączeniu z praktyką.',
  },
  Beatriz: {
    // fleurs pt_br/train 5492165931023405494.wav
    description: 'Brazilian Portuguese female voice, clear read speech',
    category: 'GENERAL',
    language: 'pt-BR',
    transcript:
      'A Cidade do Vaticano usa o italiano em suas legislações e comunicações oficiais.',
  },
  Rafael: {
    // fleurs pt_br/dev 10777509745863636963.wav
    description: 'Brazilian Portuguese male voice, clear read speech',
    category: 'GENERAL',
    language: 'pt-BR',
    transcript:
      'Dizem que os saques generalizados continuaram durante toda a noite, ao passo que não se via a polícia presente nas ruas de Bishkek.',
  },
  Olga: {
    // fleurs ru_ru/dev 13441608534573947650.wav
    description: 'Russian female voice, clear read speech',
    category: 'GENERAL',
    language: 'ru-RU',
    transcript:
      'Сначала одежда находилась под сильным влиянием византийской культуры на востоке.',
  },
  Dmitry: {
    // fleurs ru_ru/dev 1058855104882293960.wav
    description: 'Russian male voice, clear read speech',
    category: 'GENERAL',
    language: 'ru-RU',
    transcript:
      'В связи со своей относительной недоступностью, "Тимбукту" стал метафорой экзотической дальней земли.',
  },
  Mei: {
    // fleurs cmn_hans_cn/dev 12720876761211996171.wav
    description: 'Mandarin Chinese female voice, clear read speech',
    category: 'GENERAL',
    language: 'zh-CN',
    transcript:
      '当地政府警告核电站附近的居民，要待在室内，关掉空调，不要喝自来水。',
  },
  Wei: {
    // fleurs cmn_hans_cn/dev 11896869400830064294.wav
    description: 'Mandarin Chinese male voice, clear read speech',
    category: 'GENERAL',
    language: 'zh-CN',
    transcript:
      '西班牙人开始了长达三个世纪的殖民时期。',
  },
};

async function readSystemVoiceAudio(name: SystemVoiceName) {
  const filePath = path.join(SYSTEM_VOICES_DIR, `${name}.wav`);
  const buffer = Buffer.from(await fs.readFile(filePath));
  return { buffer, contentType: 'audio/wav' };
}

async function uploadSystemVoiceAudio({
  key,
  buffer,
  contentType,
}: {
  key: string
  buffer: Buffer
  contentType: string
}) {
  const commandInput: PutObjectCommandInput = {
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  await r2.send(new PutObjectCommand(commandInput));
}

async function seedSystemVoice(name: SystemVoiceName) {
  const { buffer, contentType } = await readSystemVoiceAudio(name);

  const existingSystemVoice = await prisma.voice.findFirst({
    where: {
      variant: 'SYSTEM',
      name,
    },
    select: { id: true },
  });

  const meta = systemVoiceMetadata[name];

  if (existingSystemVoice) {
    const r2ObjectKey = `voices/system/${existingSystemVoice.id}`;

    await uploadSystemVoiceAudio({
      key: r2ObjectKey,
      buffer,
      contentType,
    });

    await prisma.voice.update({
      where: { id: existingSystemVoice.id },
      data: { r2ObjectKey, ...meta },
    });
    return;
  }

  const voice = await prisma.voice.create({
    data: {
      name,
      variant: 'SYSTEM',
      orgId: null,
      ...meta,
    },
    select: {
      id: true,
    },
  });

  const r2ObjectKey = `voices/system/${voice.id}`;

  try {
    await uploadSystemVoiceAudio({
      key: r2ObjectKey,
      buffer,
      contentType,
    });

    await prisma.voice.update({
      where: {
        id: voice.id,
      },
      data: {
        r2ObjectKey,
      },
    });
  } catch (error) {
    await prisma.voice
      .delete({
        where: {
          id: voice.id,
        },
      })
      .catch(noop);

    throw error;
  }
};

async function main() {
  console.log(
    `Seeding ${SYSTEM_VOICE_NAMES.length} system voices...`,
  );

  for (const name of SYSTEM_VOICE_NAMES) {
    console.log(`- ${name}`);
    await seedSystemVoice(name);
  }

  console.log('System voice seed completed.');
}

main()
  .catch((error: unknown) => {
    console.error('Failed to seed system voices:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
