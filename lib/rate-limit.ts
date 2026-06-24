// Tiny in-memory fixed-window rate limiter (bonus: basic rate limiting). Good
// enough for a single-instance demo deployment; a multi-instance setup would
// swap this for Redis/Upstash. Keys are caller-defined (e.g. "login:<ip>").

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

/**
 * Returns true if the call is allowed, false if the limit is exceeded.
 * @param key    unique bucket key (per user / per action)
 * @param limit  max calls allowed within the window
 * @param windowMs window length in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}
