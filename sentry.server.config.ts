// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

Sentry.init({
  dsn: "https://812557336cfbc3157bc5918224133da2@o4512147562889216.ingest.de.sentry.io/4512147588251728",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Drop expected tRPC errors (401/403/404/...), keep only 5xx
  beforeSend(event, hint) {
    const err = hint.originalException;
    if (err instanceof TRPCError && getHTTPStatusCodeFromError(err) < 500) return null;
    return event;
  },

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});
