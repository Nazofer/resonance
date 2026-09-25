import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getSignedAudioUrl } from '@/lib/r2';

export async function GET(_: Request, { params }: { params: Promise<{ generationId: string }> }) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { generationId } = await params;

  const generation = await prisma.generation.findUnique({
    where: {
      id: generationId,
      orgId,
    }
  });

  if (!generation) {
    return new Response('Not Found', { status: 404 });
  }

  if (!generation.r2ObjectKey) {
    return new Response('Audio not available', { status: 404 });
  }

  const signedUrl = await getSignedAudioUrl(generation.r2ObjectKey);

  const audioResponse = await fetch(signedUrl);

  if (!audioResponse.ok) {
    return new Response('Failed to fetch audio', { status: 502 });
  }

  return new Response(audioResponse.body, {
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'private, max-age=3600'
    },
    status: 200
  });
}
