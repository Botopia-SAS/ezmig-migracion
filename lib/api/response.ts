import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { ServiceError } from '@/lib/errors/service-errors';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function createdResponse<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function errorResponse(message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details !== undefined && { details }) },
    { status }
  );
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = 'Forbidden') {
  return errorResponse(message, 403);
}

export function notFoundResponse(entity: string) {
  return errorResponse(`${entity} not found`, 404);
}

export function conflictResponse(message: string) {
  return errorResponse(message, 409);
}

export function validationErrorResponse(error: ZodError) {
  return errorResponse('Validation failed', 400, error.errors);
}

export function badRequestResponse(message: string) {
  return errorResponse(message, 400);
}

/**
 * Maps a ServiceError to an appropriate HTTP response
 */
export function serviceErrorResponse(error: ServiceError) {
  const statusMap: Record<string, number> = {
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    VALIDATION: 400,
    CONFLICT: 409,
  };
  return errorResponse(error.message, statusMap[error.code] ?? 500);
}

/**
 * Handles unknown errors safely, logging and returning a generic 500.
 * Never leaks internal error details to the client.
 */
export function handleRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ServiceError) {
    return serviceErrorResponse(error);
  }
  const correlationId = crypto.randomUUID();
  console.error(`[${correlationId}] ${fallbackMessage}:`, error);
  return errorResponse(fallbackMessage, 500, { correlationId });
}
