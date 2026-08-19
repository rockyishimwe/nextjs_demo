import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

// ─── Upstash Redis-backed rate limiter (production) ──────────────────────────
const UPSTASH_ENABLED =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

let upstashLimiter: Ratelimit | null = null;

if (UPSTASH_ENABLED) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  upstashLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "devevent:ratelimit",
  });
}

// ─── In-memory fallback (development only) ───────────────────────────────────
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateMap = new Map<string, RateLimitRecord>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, record] of rateMap.entries()) {
    if (now > record.resetTime) rateMap.delete(key);
  }
}

function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  cleanupExpired();
  const now = Date.now();
  const record = rateMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInSeconds: windowMs / 1000 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetInSeconds: Math.ceil((record.resetTime - now) / 1000) };
  }

  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}

/**
 * Rate-limit an identifier (typically a client IP).
 *
 * - **Production:** Uses Upstash Redis — works across instances and survives restarts.
 *   Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars.
 * - **Development:** Falls back to in-memory (resets on restart, per-process only).
 */
export async function rateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetInSeconds: Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  return inMemoryRateLimit(identifier, limit, windowMs);
}

/**
 * Extract a consistent client identifier from the request.
 *
 * - Vercel: uses `x-forwarded-for` (set by the platform)
 * - Cloudflare: use `CF-Connecting-IP` if behind CF
 * - Other: falls back to `x-real-ip`, then `"anonymous"`
 *
 * NOTE: `x-forwarded-for` is trusted only behind a reverse proxy that strips
 * or appends to it. Without a proxy the header can be spoofed by the client.
 */
export function getClientIp(req: Request): string {
  // Cloudflare
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Vercel / generic proxy
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "anonymous";
}
