import { auth } from "@clerk/nextjs/server";

/**
 * True when the current request is allowed to manage events.
 *
 * When CLERK_ADMIN_USER_ID is unset (e.g. local development) any signed-in
 * user counts as admin. Once set, only that Clerk user ID can manage events.
 */
export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const adminId = process.env.CLERK_ADMIN_USER_ID;
  return !adminId || userId === adminId;
}
