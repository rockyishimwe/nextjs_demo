import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Protect admin and auth pages — API routes handle their own auth
    "/admin/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/__clerk/:path*",
  ],
};
