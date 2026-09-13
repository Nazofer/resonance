import {
  baseProcedure, createTRPCRouter
} from '../init';

export const appRouter = createTRPCRouter({
  health: baseProcedure.query(async () => {
    return new Promise<{ status: string }>((resolve) => {
      setTimeout(() => {
        resolve({ status: 'ok' });
      }, 1000);
    });
  })
});

// export type definition of API
export type AppRouter = typeof appRouter;
