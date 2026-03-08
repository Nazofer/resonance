'use client';

import { useUser } from '@clerk/nextjs';
import {
  Headphones, ThumbsUp
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SUPPORT_EMAIL } from '../data/constants';

export function DashboardHeader() {
  const { isLoaded, user } = useUser();

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Nice to see you</p>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
          {isLoaded ? (user?.fullName ?? user?.firstName ?? 'there') : '...'}
        </h1>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`mailto:${SUPPORT_EMAIL}`} />}
        >
          <ThumbsUp />
          <span className="hidden lg:block">Feedback</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`mailto:${SUPPORT_EMAIL}`} />}
        >
          <Headphones />
          <span className="hidden lg:block">Need help?</span>
        </Button>
      </div>
    </div>
  );
}
