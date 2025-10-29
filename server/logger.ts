/**
 * Winston Logger Configuration for Server-Side Logging
 * 
 * Features:
 * - Structured JSON logging with consistent formatting
 * - Multiple transports (console, file with rotation)
 * - Environment-aware configuration (dev vs production)
 * - Log levels matching client-side logger (debug, info, warn, error, fatal)
 * - Timestamp and context tracking
 * - Error stack trace capture
 * - Daily log rotation with compression
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'node:path';

// Custom log levels matching client-side logger
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  },
  colors: {
    fatal: 'red bold',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Custom format for console output (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    const metaKeys = Object.keys(metadata);
    if (metaKeys.length > 0) {
      // Filter out internal winston properties
      const cleanMeta = Object.fromEntries(
        Object.entries(metadata).filter(([key]) => !['level', 'timestamp'].includes(key))
      );
      if (Object.keys(cleanMeta).length > 0) {
        msg += ` ${JSON.stringify(cleanMeta)}`;
      }
    }
    
    return msg;
  })
);

// Custom format for file output (JSON structured)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // Capture stack traces
  winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = path.resolve(process.cwd(), 'logs');

// Configure transports
const transports: winston.transport[] = [];

// Console transport for development
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug', // Show all logs in development
    })
  );
} else {
  // Simplified console in production (less verbose)
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'info', // Only info and above in production console
    })
  );
}

// File transport with daily rotation for all logs
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true, // Compress rotated files
  maxSize: '20m', // Rotate if file exceeds 20MB
  maxFiles: '14d', // Keep logs for 14 days
  format: fileFormat,
  level: 'debug', // Capture all levels in file
});

// Separate error log file
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d', // Keep error logs longer (30 days)
  format: fileFormat,
  level: 'error', // Only error and fatal
});

transports.push(dailyRotateTransport, errorRotateTransport);

// Create the Winston logger instance
const logger = winston.createLogger({
  levels: customLevels.levels,
  transports,
  exitOnError: false, // Don't exit on handled errors
});

// Add helper method for fatal level (not in default winston)
interface ExtendedLogger extends winston.Logger {
  fatal: (message: string, meta?: any) => winston.Logger;
}

const extendedLogger = logger as ExtendedLogger;
extendedLogger.fatal = (message: string, meta?: any) => {
  return logger.log('fatal', message, meta);
};

/**
 * Create a child logger with specific context
 * Useful for module-specific logging
 */
export function createModuleLogger(moduleName: string) {
  return extendedLogger.child({ module: moduleName });
}

/**
 * Log a user action with standardized format
 */
export function logUserAction(
  action: string,
  userId: string,
  metadata?: Record<string, any>
) {
  extendedLogger.info(`User action: ${action}`, {
    userId,
    action,
    ...metadata,
  });
}

/**
 * Log an API call with request details
 */
export function logApiCall(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, any>
) {
  let level: string;
  if (statusCode >= 500) {
    level = 'error';
  } else if (statusCode >= 400) {
    level = 'warn';
  } else {
    level = 'info';
  }
  
  extendedLogger.log(level, `${method} ${path} ${statusCode} in ${duration}ms`, {
    method,
    path,
    statusCode,
    duration,
    ...metadata,
  });
}

/**
 * Log an error with full context and stack trace
 */
export function logError(
  error: Error | string,
  context?: Record<string, any>
) {
  if (error instanceof Error) {
    extendedLogger.error(error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    });
  } else {
    extendedLogger.error(error, context);
  }
}

/**
 * Legacy log function for backwards compatibility
 * Maps to Winston with source context
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Use info level for general logs
  extendedLogger.info(message, { source, formattedTime });
}

// Export the main logger
export default extendedLogger;
