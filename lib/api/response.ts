/**
 * Standardized API Response Helpers
 * Following CodeBakers patterns for consistent error handling
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Error codes following CodeBakers standard
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

interface ApiErrorResponse {
  error: string;
  code: ErrorCodeType;
  details?: unknown;
}

interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * Create a standardized error response
 */
export function apiError(
  message: string,
  code: ErrorCodeType,
  status: number,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = { error: message, code };
  if (details !== undefined) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized') =>
    apiError(message, ErrorCode.UNAUTHORIZED, 401),

  forbidden: (message = 'Forbidden') =>
    apiError(message, ErrorCode.FORBIDDEN, 403),

  notFound: (resource = 'Resource') =>
    apiError(`${resource} not found`, ErrorCode.NOT_FOUND, 404),

  validation: (details: unknown) =>
    apiError('Validation failed', ErrorCode.VALIDATION_ERROR, 400, details),

  internal: (message = 'Internal server error') =>
    apiError(message, ErrorCode.INTERNAL_ERROR, 500),

  badRequest: (message = 'Bad request') =>
    apiError(message, ErrorCode.BAD_REQUEST, 400),

  conflict: (message = 'Resource already exists') =>
    apiError(message, ErrorCode.CONFLICT, 409),

  rateLimited: (message = 'Too many requests') =>
    apiError(message, ErrorCode.RATE_LIMITED, 429),
};

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse<ApiErrorResponse> {
  return ApiErrors.validation(error.flatten());
}

/**
 * Type guard to check if error is a ZodError
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
