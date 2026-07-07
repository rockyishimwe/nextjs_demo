interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateMap = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, record] of rateMap.entries()) {
    if (now > record.resetTime) {
      rateMap.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Lightweight in-memory rate limiter.
 *
 * NOTE: This is per-process memory and resets on server restart.
 * For production with multiple instances, replace with a Redis-backed
 * solution (e.g., @upstash/ratelimit).
 */
export function rateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60_000,
): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  const record = rateMap.get(identifier);

  // No existing record or window has expired — start a new window
  if (!record || now > record.resetTime) {
    rateMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1, resetInSeconds: windowMs / 1000 };
  }

  // Within the current window
  if (record.count >= limit) {
    const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}

/**
 * Extract a consistent client identifier from the request.
 * Prefers x-forwarded-for, falls back to x-real-ip, then a placeholder.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP in case of proxy chain
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "anonymous";
}
