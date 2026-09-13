'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

export default function HealthCheck() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.health.queryOptions());

  return (
    <div className="rounded-lg border p-6 text-center">
      <p className="text-sm text-muted-foreground">tRPC status</p>
      <p className="mt-2 text-lg font-semibold">{data.status}</p>
    </div>
  );
}
