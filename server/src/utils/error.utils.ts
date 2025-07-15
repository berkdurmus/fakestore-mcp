/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  code: string;
  status: number;

  constructor(
    message: string,
    code: string = "INTERNAL_ERROR",
    status: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  NOT_FOUND = "NOT_FOUND",
  INVALID_REQUEST = "INVALID_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CART_ERROR = "CART_ERROR",
  API_ERROR = "API_ERROR",
}

/**
 * Helper function to handle async/await errors consistently
 * @param promise - The promise to handle
 * @returns A tuple with [error, result]
 */
export async function handleAsync<T>(
  promise: Promise<T>
): Promise<[Error | null, T | null]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error: any) {
    // Convert to AppError if it's not already
    if (!(error instanceof AppError)) {
      error = new AppError(
        error.message || "An unexpected error occurred",
        error.code || ErrorCode.INTERNAL_ERROR,
        error.status || 500
      );
    }
    return [error, null];
  }
}

/**
 * Logger function for consistent error logging
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 */
export function logError(error: Error, context: string): void {
  console.error(`Error in ${context}:`, {
    message: error.message,
    code: error instanceof AppError ? error.code : "UNKNOWN_ERROR",
    stack: error.stack,
  });
}
