import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;

export interface RateLimitConfig {
  name: string;
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  auth: { name: 'auth', maxRequests: 5, windowMs: 15 * 60 * 1000 },
  api: { name: 'api', maxRequests: 100, windowMs: 15 * 60 * 1000 },
  apiKey: { name: 'apiKey', maxRequests: 200, windowMs: 15 * 60 * 1000 },
  upload: { name: 'upload', maxRequests: 10, windowMs: 60 * 60 * 1000 },
} as const;

export function checkRateLimit(
  config: RateLimitConfig,
  identifier: string
): { allowed: boolean; retryAfterMs: number; remaining: number } {
  if (!stores.has(config.name)) {
    stores.set(config.name, new Map());
  }
  const store = stores.get(config.name)!;

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now >= entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterMs: 0, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      retryAfterMs: entry.resetAt - now,
      remaining: 0,
    };
  }

  entry.count++;
  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: config.maxRequests - entry.count,
  };
}

export function rateLimitResponse(retryAfterMs: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
    }
  );
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  );
}

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        if (now >= entry.resetAt) store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}
