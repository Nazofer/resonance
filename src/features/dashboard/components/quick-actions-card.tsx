import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { QuickAction } from '@/features/dashboard/data/quick-actions';
import { cn } from '@/lib/utils';

type QuickActionsCardProps = QuickAction;

export function QuickActionsCard({
  title,
  description,
  gradient,
  href,
}: QuickActionsCardProps) {
  return (
    <div className="flex gap-4 rounded-xl border bg-card p-3">
      {/* Visual placeholder with gradient */}
      <div
        className={cn(
          'relative h-31 w-41 shrink-0 overflow-hidden rounded-xl bg-linear-to-br',
          gradient,
        )}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-12 rounded-full bg-white/30" />
        </div>
        <div className="absolute inset-2 rounded-lg ring-2 ring-white/20 ring-inset" />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between py-1">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs/relaxed text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="xs" className="w-fit" nativeButton={false} render={<Link href={href} />}>
          Try now
          <ArrowUpRight className="size-3" />
        </Button>
      </div>
    </div>
  );
}
