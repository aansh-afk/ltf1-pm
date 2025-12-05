/**
 * GitHub Integration Error Handling
 *
 * Structured error types and utilities for GitHub API interactions.
 */

// Error codes for GitHub API errors
export enum GitHubErrorCode {
  RATE_LIMITED = 'RATE_LIMITED',
  SECONDARY_RATE_LIMITED = 'SECONDARY_RATE_LIMITED',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INSTALLATION_SUSPENDED = 'INSTALLATION_SUSPENDED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNKNOWN = 'UNKNOWN',
}

// Error class for GitHub API errors
export class GitHubError extends Error {
  code: GitHubErrorCode;
  retryable: boolean;
  retryAfter?: number; // seconds
  statusCode?: number;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    code: GitHubErrorCode,
    options?: {
      retryable?: boolean;
      retryAfter?: number;
      statusCode?: number;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'GitHubError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.retryAfter = options?.retryAfter;
    this.statusCode = options?.statusCode;
    this.context = options?.context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

// Parse GitHub API response into GitHubError
export function parseGitHubError(
  response: Response | Error,
  responseBody?: any
): GitHubError {
  // Handle network errors
  if (response instanceof Error && !(response instanceof Response)) {
    return new GitHubError(
      response.message || 'Network error',
      GitHubErrorCode.NETWORK_ERROR,
      { retryable: true }
    );
  }

  const res = response as Response;
  const status = res.status;

  // Rate limiting
  if (status === 403) {
    const rateLimitRemaining = res.headers.get('X-RateLimit-Remaining');
    const retryAfter = res.headers.get('Retry-After');
    const rateLimitReset = res.headers.get('X-RateLimit-Reset');

    if (rateLimitRemaining === '0' || responseBody?.message?.includes('rate limit')) {
      const resetTime = rateLimitReset ? parseInt(rateLimitReset, 10) : undefined;
      const retrySeconds = retryAfter
        ? parseInt(retryAfter, 10)
        : resetTime
          ? Math.max(0, resetTime - Math.floor(Date.now() / 1000))
          : 60;

      return new GitHubError(
        'GitHub API rate limit exceeded',
        GitHubErrorCode.RATE_LIMITED,
        {
          retryable: true,
          retryAfter: retrySeconds,
          statusCode: status,
        }
      );
    }

    // Secondary rate limit (abuse detection)
    if (responseBody?.message?.includes('abuse') || responseBody?.message?.includes('secondary')) {
      return new GitHubError(
        'GitHub secondary rate limit triggered',
        GitHubErrorCode.SECONDARY_RATE_LIMITED,
        {
          retryable: true,
          retryAfter: parseInt(retryAfter || '60', 10),
          statusCode: status,
        }
      );
    }

    // Installation suspended
    if (responseBody?.message?.includes('suspended')) {
      return new GitHubError(
        'GitHub App installation is suspended',
        GitHubErrorCode.INSTALLATION_SUSPENDED,
        {
          retryable: false,
          statusCode: status,
        }
      );
    }

    return new GitHubError(
      responseBody?.message || 'Forbidden',
      GitHubErrorCode.FORBIDDEN,
      {
        retryable: false,
        statusCode: status,
      }
    );
  }

  // Unauthorized
  if (status === 401) {
    const message = responseBody?.message || 'Unauthorized';
    if (message.includes('expired') || message.includes('token')) {
      return new GitHubError(
        'GitHub token expired or invalid',
        GitHubErrorCode.TOKEN_EXPIRED,
        {
          retryable: false,
          statusCode: status,
        }
      );
    }
    return new GitHubError(
      message,
      GitHubErrorCode.UNAUTHORIZED,
      {
        retryable: false,
        statusCode: status,
      }
    );
  }

  // Not found
  if (status === 404) {
    return new GitHubError(
      responseBody?.message || 'Resource not found',
      GitHubErrorCode.NOT_FOUND,
      {
        retryable: false,
        statusCode: status,
      }
    );
  }

  // Validation error
  if (status === 422) {
    return new GitHubError(
      responseBody?.message || 'Validation failed',
      GitHubErrorCode.VALIDATION_ERROR,
      {
        retryable: false,
        statusCode: status,
        context: { errors: responseBody?.errors },
      }
    );
  }

  // Server errors
  if (status >= 500) {
    return new GitHubError(
      responseBody?.message || 'GitHub server error',
      GitHubErrorCode.SERVER_ERROR,
      {
        retryable: true,
        retryAfter: 30,
        statusCode: status,
      }
    );
  }

  // Unknown error
  return new GitHubError(
    responseBody?.message || `HTTP ${status}`,
    GitHubErrorCode.UNKNOWN,
    {
      retryable: false,
      statusCode: status,
    }
  );
}

// Error recovery strategies
export const errorRecoveryStrategies: Record<
  GitHubErrorCode,
  {
    retryable: boolean;
    strategy: string;
    maxRetries: number;
    baseDelayMs: number;
  }
> = {
  [GitHubErrorCode.RATE_LIMITED]: {
    retryable: true,
    strategy: 'Wait until reset, then retry',
    maxRetries: 3,
    baseDelayMs: 60000,
  },
  [GitHubErrorCode.SECONDARY_RATE_LIMITED]: {
    retryable: true,
    strategy: 'Exponential backoff with 1min base',
    maxRetries: 3,
    baseDelayMs: 60000,
  },
  [GitHubErrorCode.NOT_FOUND]: {
    retryable: false,
    strategy: 'Log and skip',
    maxRetries: 0,
    baseDelayMs: 0,
  },
  [GitHubErrorCode.UNAUTHORIZED]: {
    retryable: false,
    strategy: 'Alert, verify credentials',
    maxRetries: 0,
    baseDelayMs: 0,
  },
  [GitHubErrorCode.FORBIDDEN]: {
    retryable: false,
    strategy: 'Check permissions',
    maxRetries: 0,
    baseDelayMs: 0,
  },
  [GitHubErrorCode.VALIDATION_ERROR]: {
    retryable: false,
    strategy: 'Log validation errors',
    maxRetries: 0,
    baseDelayMs: 0,
  },
  [GitHubErrorCode.SERVER_ERROR]: {
    retryable: true,
    strategy: 'Retry with exponential backoff',
    maxRetries: 3,
    baseDelayMs: 5000,
  },
  [GitHubErrorCode.NETWORK_ERROR]: {
    retryable: true,
    strategy: 'Retry with exponential backoff',
    maxRetries: 3,
    baseDelayMs: 1000,
  },
  [GitHubErrorCode.INSTALLATION_SUSPENDED]: {
    retryable: false,
    strategy: 'Mark installation suspended',
    maxRetries: 0,
    baseDelayMs: 0,
  },
  [GitHubErrorCode.TOKEN_EXPIRED]: {
    retryable: false,
    strategy: 'Regenerate token and retry',
    maxRetries: 1,
    baseDelayMs: 0,
  },
  [GitHubErrorCode.UNKNOWN]: {
    retryable: false,
    strategy: 'Log and investigate',
    maxRetries: 0,
    baseDelayMs: 0,
  },
};

// Calculate retry delay with exponential backoff and jitter
export function calculateRetryDelay(
  error: GitHubError,
  attemptNumber: number
): number {
  const strategy = errorRecoveryStrategies[error.code];

  // Use error-specific retry after if available
  if (error.retryAfter) {
    return error.retryAfter * 1000;
  }

  // Exponential backoff with jitter
  const baseDelay = strategy.baseDelayMs;
  const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);
  const jitter = Math.random() * 1000; // 0-1 second jitter

  return Math.min(exponentialDelay + jitter, 300000); // Max 5 minutes
}

// Check if we should retry based on error and attempt count
export function shouldRetry(error: GitHubError, attemptNumber: number): boolean {
  const strategy = errorRecoveryStrategies[error.code];
  return error.retryable && attemptNumber <= strategy.maxRetries;
}

// Format error for logging (safe - no tokens)
export function formatErrorForLogging(error: GitHubError): {
  code: string;
  message: string;
  retryable: boolean;
  statusCode?: number;
} {
  return {
    code: error.code,
    message: error.message,
    retryable: error.retryable,
    statusCode: error.statusCode,
  };
}
