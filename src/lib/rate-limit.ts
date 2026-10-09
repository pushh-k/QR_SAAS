interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter.
 * @param key Identifier (e.g. IP + endpoint)
 * @param limit Max allowed requests within window
 * @param windowMs Time window in milliseconds (default 60 seconds)
 */
export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60 * 1000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  // Clean old entries occasionally
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt < now) {
        rateLimitMap.delete(k);
      }
    }
  }

  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetIn: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetIn: Math.ceil((record.resetAt - now) / 1000),
  };
}
