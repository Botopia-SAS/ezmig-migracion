import type { ZodSchema } from 'zod';
import { badRequestResponse, validationErrorResponse } from './response';

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
