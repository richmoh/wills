// A small in-memory fixed-window rate limiter. The app runs as a single
// process behind nginx, so process memory sees every request; counts reset
// when the process restarts.

interface Bucket {
  count: number;
  resetAt: number;
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

// Survive Next.js dev hot reloads via globalThis, like the Postgres pool.
const globalForLimits = globalThis as unknown as {
  __rateBuckets?: Map<string, Bucket>;
  __rateSweep?: ReturnType<typeof setInterval>;
};
const buckets = (globalForLimits.__rateBuckets ??= new Map<string, Bucket>());

// Keys contain IP and email addresses, so finished windows are dropped
// promptly rather than left in memory. unref: never keeps the process alive.
globalForLimits.__rateSweep ??= setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, MINUTE);
globalForLimits.__rateSweep.unref?.();

/**
 * The client's address as nginx saw it. nginx sets X-Real-IP itself, so a
 * caller cannot choose it. X-Forwarded-For is only a fallback, and there the
 * last entry is the one nginx appended — earlier entries are whatever the
 * caller sent.
 */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").pop()?.trim();
  return forwarded || "unknown";
}

/**
 * Counts one attempt against `key`. Returns null while the caller is within
 * `limit` attempts per `windowMs`, or a 429 Response once they are over it.
 */
export function rateLimited(key: string, limit: number, windowMs: number): Response | null {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const minutes = Math.ceil(retryAfter / 60);
  return Response.json(
    {
      error: `Too many attempts — please wait ${
        minutes <= 1 ? "a minute" : `${minutes} minutes`
      } and try again.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
