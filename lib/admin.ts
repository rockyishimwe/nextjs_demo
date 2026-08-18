import { auth } from "@clerk/nextjs/server";

let adminWarned = false;

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
  if (!adminId && !adminWarned) {
    adminWarned = true;
    console.warn(
      "⚠ CLERK_ADMIN_USER_ID is not set. ALL signed-in users are treated as admin. " +
        "Set CLERK_ADMIN_USER_ID in .env.local to restrict access to your own account.",
    );
  }
  return !adminId || userId === adminId;
}
