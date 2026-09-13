import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';


const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

interface UploadAudioOptions {
  buffer: Buffer
  key: string
  contentType?: string
}

export const uploadAudio = async (options: UploadAudioOptions): Promise<void> => {
  const { buffer, key, contentType = 'audio/wav' } = options;

  await r2.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
};

export const deleteAudio = async (key: string): Promise<void> => {
  await r2.send(new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  }));
};

const SIGNED_URL_EXPIRATION_S = 3600;

export const getSignedAudioUrl = async (key: string): Promise<string> => {
  return await getSignedUrl(r2, new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  }), { expiresIn: SIGNED_URL_EXPIRATION_S });
};
