import Link from 'next/link';
import {
  Book, Sparkles, Volume2, AudioLines
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SUPPORT_EMAIL } from '@/features/dashboard/data/constants';

export function VoicePreviewPlaceholder() {
  return (
    <div className="hidden h-full flex-1 flex-col items-center justify-center gap-6 border-t lg:flex">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex w-32 items-center justify-center">

          <div className="absolute left-0 -rotate-30 rounded-full bg-muted p-4">
            <Volume2 className="size-5 text-muted-foreground" />
          </div>

          <div className="relative z-10 rounded-full bg-foreground p-4">
            <Sparkles className="size-5 text-background" />
          </div>

          <div className="absolute right-0 -rotate-30 rounded-full bg-muted p-4">
            <AudioLines className="size-5 text-muted-foreground" />
          </div>

        </div>

        <p className="text-lg font-semibold tracking-tight text-foreground">
          Preview will appear here
        </p>
        <p className="max-w-64 text-center text-sm text-muted-foreground">
          Once you generate, your audio result will appear here. Sit back and relax.
        </p>
      </div>
      <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`mailto:${SUPPORT_EMAIL}`} />}>
        <Book />
        Don&apos;t know how?
      </Button>
    </div>
  );
};
