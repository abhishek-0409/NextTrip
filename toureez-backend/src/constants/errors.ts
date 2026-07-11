
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  FORBIDDEN: 'You do not have permission to perform this action',
  VALIDATION_FAILED: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  DATABASE_ERROR: 'Unable to complete request',
  RATE_LIMITED: 'Too many requests, please try again later',
  CORS_NOT_ALLOWED: 'Origin is not allowed',
  INTERNAL_SERVER_ERROR: 'Something went wrong',
} as const;


export class AppError extends Error {

  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
