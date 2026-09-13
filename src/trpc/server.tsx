import 'server-only'; // <-- ensure this file cannot be imported from the client

import {
  createTRPCOptionsProxy, type TRPCQueryKeyWithoutPrefix
} from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';
import {
  dehydrate, HydrationBoundary, noop, type QueryClient
} from '@tanstack/react-query';

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

// If your router is on a separate server, pass a client:
// createTRPCOptionsProxy<AppRouter>({
//   client: createTRPCClient<AppRouter>({
//     links: [httpLink({ url: '...' })],
//   }),
//   queryClient: getQueryClient,
// });

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

type QueryOpts = Parameters<QueryClient['query']>[0];
type InfiniteOpts = Parameters<QueryClient['infiniteQuery']>[0];

export function prefetch(queryOptions: { queryKey: TRPCQueryKeyWithoutPrefix }) {
  const queryClient = getQueryClient();
  // tRPC keys are [path, { input, type }]; infiniteQueryOptions() sets type: 'infinite'
  const [, meta] = queryOptions.queryKey;
  // fire-and-forget: pending queries get dehydrated and streamed to the client
  if (meta?.type === 'infinite') {
    void queryClient.infiniteQuery(queryOptions as unknown as InfiniteOpts).catch(noop);
  } else {
    void queryClient.query(queryOptions as QueryOpts).catch(noop);
  }
}
