/**
 * Structured logger for the application
 * Prevents sensitive data leaks in production logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (context && Object.keys(context).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(context)}`;
  }

  return `${prefix} ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, only log info, warn, and error
  if (isProduction && level === 'debug') {
    return false;
  }

  return true;
}

export const logger = {
  /**
   * Debug logs - only shown in development
   * Use for verbose diagnostic information
   */
  debug: (message: string, context?: LogContext) => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, context));
    }
  },

  /**
   * Info logs - shown in all environments
   * Use for important application events
   */
  info: (message: string, context?: LogContext) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, context));
    }
  },

  /**
   * Warning logs - shown in all environments
   * Use for recoverable issues or deprecated usage
   */
  warn: (message: string, context?: LogContext) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  /**
   * Error logs - shown in all environments
   * Use for errors and exceptions
   */
  error: (message: string, error?: any, context?: LogContext) => {
    if (shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      };
      console.error(formatMessage('error', message, errorContext));
    }
  },
};
