import type { ZodSchema } from 'zod';
import { badRequestResponse, errorResponse, validationErrorResponse } from './response';

/**
 * Parse a string parameter as an integer.
 * Returns the parsed number, or null if invalid.
 */
export function parseIntParam(value: string | undefined | null): number | null {
  if (!value) return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Require a string parameter to be a valid integer.
 * Returns a tuple: [value, errorResponse].
 * If valid: [number, null]. If invalid: [null, NextResponse].
 */
export function requireIntParam(
  value: string | undefined | null,
  name: string
): [number, null] | [null, ReturnType<typeof badRequestResponse>] {
  if (!value) return [null, badRequestResponse(`${name} is required`)];
  const num = parseInt(value, 10);
  if (isNaN(num)) return [null, badRequestResponse(`Invalid ${name}`)];
  return [num, null];
}

/**
 * Validate request body against a Zod schema.
 * Returns a tuple: [data, errorResponse].
 * If valid: [data, null]. If invalid: [null, NextResponse].
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): [T, null] | [null, ReturnType<typeof validationErrorResponse>] {
  const result = schema.safeParse(body);
  if (!result.success) {
    return [null, validationErrorResponse(result.error)];
  }
  return [result.data, null];
}

/**
 * Parse request body with size limit.
 * Returns [body, null] or [null, errorResponse].
 */
export async function parseBodyWithLimit(
  req: Request,
  maxSizeBytes: number = 1024 * 1024
): Promise<[unknown, null] | [null, ReturnType<typeof errorResponse>]> {
  const contentLength = req.headers.get('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > maxSizeBytes) {
    return [null, errorResponse('Request body too large', 413)];
  }
  try {
    const body = await req.json();
    return [body, null];
  } catch {
    return [null, badRequestResponse('Invalid JSON body')];
  }
}

/**
 * Strip HTML tags from string fields as an extra XSS prevention layer.
 */
export function sanitizeStrings<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = value
        .replaceAll(/<[^>]*>/g, '')
        .trim();
    }
  }
  return sanitized;
}
