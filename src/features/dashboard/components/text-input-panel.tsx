'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import {
  COST_PER_UNIT,
  TEXT_MAX_LENGTH,
} from '@/features/text-to-speech/data/constants';
import { Coins } from 'lucide-react';

export function TextInputPanel() {
  const [text, setText] = useState('');
  const router = useRouter();

  const handleGenerate = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    router.push(`/text-to-speech?text=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div
      className={cn(
        'rounded-[22px] bg-linear-185 from-[#F97316] from-15% via-[#FBBF24] via-39% to-[#FDE68A] to-85% p-0.5',
        'shadow-[0_0_0_4px_var(--background)]',
      )}
    >
      {/* Using px values for border-radius to ensure proper gradient border math (outer - padding = inner). */}
      {/* Standard classes like rounded-4xl use CSS calc() which doesn't align cleanly at corners. */}
      <div className="rounded-[20px] bg-background/95 p-1">
        <div className="space-y-4 rounded-2xl bg-card p-4 drop-shadow-xs">
          <Textarea
            placeholder="Start typing or paste your text here..."
            className={`
              min-h-35 resize-none border-0 bg-transparent p-0 shadow-none
              focus-visible:ring-0
              dark:bg-transparent
            `}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            maxLength={TEXT_MAX_LENGTH}
          />

          {/* Bottom info */}

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="gap-1.5 border-dashed">
              <Coins className="size-3 text-chart-5" />
              <span className="text-xs">
                {text.length === 0 ? (
                  'Start typing to estimate'
                ) : (
                  <>
                    <span className="tabular-nums">
                      ${(text.length * COST_PER_UNIT).toFixed(4)}
                    </span>{' '}
                    estimated
                  </>
                )}
              </span>
            </Badge>
            <span className="text-xs text-muted-foreground">
              {text.length.toLocaleString()} /{' '}
              {TEXT_MAX_LENGTH.toLocaleString()} characters
            </span>
          </div>
        </div>

        {/* Action bar */}

        <div className="flex items-center justify-end p-3">
          <Button
            size="sm"
            disabled={!text.trim()}
            onClick={handleGenerate}
            className="w-full lg:w-auto"
          >
            Generate speech
          </Button>
        </div>
      </div>
    </div>
  );
}
