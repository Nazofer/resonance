import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)']);

const isOrgSelectionRoute = createRouteMatcher(['/org-selection(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    await auth.protect();
  }

  if (isOrgSelectionRoute(req)) {
    return NextResponse.next();
  }

  if (!orgId) {
    return NextResponse.redirect(new URL('/org-selection', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
