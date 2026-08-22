"use client";

import { useAuth } from "@clerk/nextjs";

/**
 * Client-side hook that checks whether the current Clerk user is an admin.
 *
 * Requires `NEXT_PUBLIC_CLERK_ADMIN_USER_ID` to be set in the environment.
 * When the env var is unset every signed-in user is treated as admin (dev mode).
 */
export function useAdmin() {
  const { userId } = useAuth();

  const adminId = process.env.NEXT_PUBLIC_CLERK_ADMIN_USER_ID;

  if (!userId) return false;
  if (!adminId) return true; // dev mode — all signed-in users are admin
  return userId === adminId;
}
