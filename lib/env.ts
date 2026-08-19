/**
 * Environment variable validation.
 *
 * This module validates required environment variables at startup.
 * If any are missing, the app will fail fast with a clear error message
 * instead of crashing later with a cryptic error.
 */

const requiredServerVars = ["MONGODB_URI", "CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] as const;

type ServerEnv = Record<(typeof requiredServerVars)[number], string>;
type OptionalEnv = Record<string, string | undefined>;

let validatedEnv: ServerEnv | null = null;

/**
 * Validate and return server environment variables.
 * Throws a clear error if any required variable is missing.
 * Caches the result so validation only runs once.
 */
export function getServerEnv(): ServerEnv & OptionalEnv {
  if (validatedEnv) return validatedEnv as ServerEnv & OptionalEnv;

  const missing: string[] = [];

  for (const key of requiredServerVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Add them to .env.local. See .env.example for reference.`,
    );
  }

  validatedEnv = {} as ServerEnv;
  for (const key of requiredServerVars) {
    (validatedEnv as Record<string, string>)[key] = process.env[key]!;
  }

  return validatedEnv as ServerEnv & OptionalEnv;
}

/**
 * Check if optional services are configured.
 * Useful for feature-gating (e.g., only enable email if RESEND_API_KEY is set).
 */
export function isServiceConfigured(service: "cloudinary" | "upstash" | "resend" | "posthog"): boolean {
  switch (service) {
    case "cloudinary":
      return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    case "upstash":
      return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    case "resend":
      return !!process.env.RESEND_API_KEY;
    case "posthog":
      return !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
  }
}
