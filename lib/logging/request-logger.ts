/**
 * Request Logger
 * Phase 2 - Issue #36: Structured logging with request tracing
 */

import { NextRequest } from 'next/server';

export interface LogContext {
  requestId?: string;
  userId?: string;
  agentId?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

/**
 * Extract request ID from request
 */
export function getRequestId(request: NextRequest | Request): string | null {
  return request.headers.get('x-request-id');
}

/**
 * Create log context from request
 */
export function createLogContext(request: NextRequest): LogContext {
  return {
    requestId: getRequestId(request) || undefined,
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
  };
}

/**
 * Structured logger with request context
 */
export class RequestLogger {
  private context: LogContext;

  constructor(request: NextRequest | LogContext) {
    if (request instanceof NextRequest) {
      this.context = createLogContext(request);
    } else {
      this.context = request;
    }
  }

  /**
   * Add additional context
   */
  withContext(additionalContext: LogContext): RequestLogger {
    this.context = { ...this.context, ...additionalContext };
    return this;
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any): void {
    this.log('ERROR', message, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, data);
    }
  }

  /**
   * Internal log method
   */
  private log(level: string, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data && { data }),
    };

    // In production, send to logging service (e.g., DataDog, LogRocket, etc.)
    // For now, use console with structured format
    const prefix = this.context.requestId ? `[${this.context.requestId}]` : '';

    switch (level) {
      case 'ERROR':
        console.error(`${prefix} ${message}`, data || '');
        break;
      case 'WARN':
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case 'DEBUG':
        console.debug(`${prefix} ${message}`, data || '');
        break;
      default:
        console.log(`${prefix} ${message}`, data || '');
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production' && process.env.LOGGING_ENDPOINT) {
      this.sendToLoggingService(logEntry);
    }
  }

  /**
   * Send log to external service
   */
  private sendToLoggingService(logEntry: any): void {
    // Implement integration with logging service (e.g., DataDog, Logtail, etc.)
    // Example:
    // fetch(process.env.LOGGING_ENDPOINT, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry),
    // }).catch(err => console.error('Failed to send log:', err));
  }
}

/**
 * Create logger from request
 */
export function createLogger(request: NextRequest | LogContext): RequestLogger {
  return new RequestLogger(request);
}

/**
 * Log API request/response
 */
export async function logApiRequest(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  const logger = createLogger(request);
  const startTime = performance.now();

  try {
    const response = await handler();
    const duration = performance.now() - startTime;

    logger.info('API Request', {
      status: response.status,
      duration: `${duration.toFixed(2)}ms`,
    });

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error('API Request Failed', {
      error,
      duration: `${duration.toFixed(2)}ms`,
    });

    throw error;
  }
}
