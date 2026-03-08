import {
  IconHeadphones, IconThumbUp
} from '@tabler/icons-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { SUPPORT_EMAIL } from '@/features/dashboard/data/constants';

export function PageHeader({
  title,
  className,
}: {
  title: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b p-4',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`mailto:${SUPPORT_EMAIL}`}>
            <IconThumbUp />
            <span className="hidden lg:block">Feedback</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`mailto:${SUPPORT_EMAIL}`}>
            <IconHeadphones />
            <span className="hidden lg:block">Need help?</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
