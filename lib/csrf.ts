import { cookies } from "next/headers";
import { createHmac, randomBytes } from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.CLERK_SECRET_KEY || "dev-csrf-fallback";
const TOKEN_LENGTH = 32;
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a CSRF token and store it in a cookie.
 * Returns the token to embed in forms/headers.
 */
export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(TOKEN_LENGTH).toString("hex");
  const expires = Date.now() + EXPIRY_MS;
  const payload = `${token}:${expires}`;
  const signature = createHmac("sha256", CSRF_SECRET).update(payload).digest("hex");
  const fullToken = `${payload}:${signature}`;

  const cookieStore = await cookies();
  cookieStore.set("csrf_token", fullToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: EXPIRY_MS / 1000,
  });

  return token;
}

/**
 * Validate a CSRF token from a request against the cookie.
 * Returns true if valid, false otherwise.
 */
export async function validateCsrfToken(token: string | null): Promise<boolean> {
  if (!token) return false;

  const cookieStore = await cookies();
  const stored = cookieStore.get("csrf_token")?.value;
  if (!stored) return false;

  const parts = stored.split(":");
  if (parts.length !== 3) return false;

  const [storedToken, expiresStr, storedSignature] = parts;
  const expires = parseInt(expiresStr, 10);

  // Check expiry
  if (Date.now() > expires) return false;

  // Verify signature
  const payload = `${storedToken}:${expiresStr}`;
  const expectedSignature = createHmac("sha256", CSRF_SECRET).update(payload).digest("hex");

  if (storedSignature !== expectedSignature) return false;

  // Verify the token matches
  return storedToken === token;
}
