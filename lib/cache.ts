import { unstable_cache } from "next/cache";

/**
 * Cached wrapper around unstable_cache.
 * Public event data is cached for 60s (ISR-style) and tagged for targeted revalidation.
 */
export function cacheEvents<T>(fn: () => Promise<T>, tags: string[] = ["events"]) {
  return unstable_cache(fn, tags, {
    revalidate: 60, // 60 seconds
    tags,
  });
}

/**
 * Cache a single event by slug.
 */
export function cacheEventBySlug<T>(fn: () => Promise<T>, slug: string) {
  return unstable_cache(fn, [`event-${slug}`], {
    revalidate: 60,
    tags: ["events", `event-${slug}`],
  });
}
