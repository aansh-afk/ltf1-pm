/**
 * Type-safe error handling utilities
 * Replaces unsafe `as Error` casts in catch blocks
 */

/**
 * Safely convert an unknown caught value to an Error instance.
 * Handles Error objects, strings, objects with message property, and other types.
 */
export function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  ) {
    return new Error((value as { message: string }).message);
  }
  return new Error(String(value));
}

/**
 * Extract an error message string from an unknown caught value.
 * Shorthand for `toError(value).message`.
 */
export function getErrorMessage(value: unknown): string {
  return toError(value).message;
}
