// Simple in-memory rate limiter
// In production, use Redis
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number = 5, windowMs: number = 60 * 1000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count < maxRequests) {
    record.count++;
    return { allowed: true, remaining: maxRequests - record.count };
  }

  return { allowed: false, remaining: 0 };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
