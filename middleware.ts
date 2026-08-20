import { clerkMiddleware } from "@clerk/nextjs/server";

// Route protection is done per-page/layout with auth() checks (see
// app/admin/layout.tsx and app/events/page.tsx). This middleware keeps Clerk's
// auth state available across requests without path-based matching.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
