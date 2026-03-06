import { prisma } from '@/lib/db';

export default async function TestPage() {
  const voices = await prisma.voice.findMany();

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Voices</h1>
      <ul className="space-y-2">
        {voices.map(voice => (
          <li key={voice.id}>{voice.name} - {voice.category} - {voice.variant}</li>
        ))}
      </ul>
    </div>
  );
}