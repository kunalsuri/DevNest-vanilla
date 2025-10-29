/**
 * Observability System Initialization
 * 
 * Centralized initialization and configuration for the complete observability stack:
 * - Logging system configuration
 * - Tracing setup 
 * - Metrics collection
 * - External service integrations
 * - Global error handlers
 */

import { logger, LogLevel, ExternalTransport, BatchTransport, FileTransport, ServerTransport } from '@/lib/logger';
import { tracer } from '@/lib/tracing';
import { metrics, metricsUtils } from '@/lib/metrics';

export interface ObservabilityConfig {
  environment?: 'development' | 'production' | 'test';
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  enableConsoleLogging?: boolean;
  externalServices?: {
    sentry?: {
      dsn: string;
      environment?: string;
    };
    datadog?: {
      apiKey: string;
      endpoint?: string;
      site?: string;
    };
    jaeger?: {
      endpoint: string;
      serviceName?: string;
    };
    prometheus?: {
      endpoint: string;
    };
  };
  features?: {
    enableTracing?: boolean;
    enableMetrics?: boolean;
    enableGlobalErrorHandling?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableFileLogging?: boolean;
  };
  fileLogging?: {
    logDirectory?: string;
    maxFileSize?: number;
    maxFiles?: number;
    rotateDaily?: boolean;
    separateByLevel?: boolean;
  };
}

class ObservabilityInitializer {
  private static instance: ObservabilityInitializer;
  private initialized = false;
  private config: ObservabilityConfig = {};

  static getInstance(): ObservabilityInitializer {
    if (!ObservabilityInitializer.instance) {
      ObservabilityInitializer.instance = new ObservabilityInitializer();
    }
    return ObservabilityInitializer.instance;
  }

  /**
   * Initialize the complete observability system
   */
  initialize(config: ObservabilityConfig = {}): void {
    if (this.initialized) {
      logger.warn('Observability system already initialized');
      return;
    }

    this.config = {
      environment: import.meta.env.MODE as 'development' | 'production',
      logLevel: (import.meta.env.VITE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error' | 'fatal') || 'info',
      enableConsoleLogging: true,
      features: {
        enableTracing: true,
        enableMetrics: true,
        enableGlobalErrorHandling: true,
        enablePerformanceMonitoring: true,
        enableFileLogging: import.meta.env.VITE_ENABLE_FILE_LOGGING === 'true' || import.meta.env.MODE !== 'development',
      },
      fileLogging: {
        logDirectory: typeof process !== 'undefined' && process.cwd 
          ? `${process.cwd()}/logs`  // Absolute path to root /logs directory
          : 'logs',                  // Fallback for browser
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        rotateDaily: true,
        separateByLevel: true,
      },
      ...config,
    };

    // Initialize core systems
    this.initializeLogging();
    this.initializeTracing();
    this.initializeMetrics();
    this.setupGlobalErrorHandling();
    this.setupPerformanceMonitoring();

    this.initialized = true;

    logger.info('Observability system initialized', {
      environment: this.config.environment,
      logLevel: this.config.logLevel,
      features: this.config.features,
      externalServices: Object.keys(this.config.externalServices || {}),
      timestamp: new Date().toISOString(),
    }, 'ObservabilityInitializer');
  }

  /**
   * Initialize and configure the logging system
   */
  private initializeLogging(): void {
    // Set log level
    const logLevelMap: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
      fatal: LogLevel.FATAL,
    };

    const level = logLevelMap[this.config.logLevel!] ?? LogLevel.INFO;
    logger.setMinLevel(level);

    // Configure console logging
    if (!this.config.enableConsoleLogging && this.config.environment === 'production') {
      logger.removeTransport('console');
    }

    // Setup external services
    this.setupExternalLoggingServices();
  }

  /**
   * Setup external logging service integrations
   */
  private setupExternalLoggingServices(): void {
    const services = this.config.externalServices;
    if (!services) return;

    // Sentry integration
    if (services.sentry?.dsn) {
      logger.addTransport(new ExternalTransport('sentry', {
        apiKey: services.sentry.dsn,
      }));

      logger.info('Sentry logging transport configured', {
        environment: services.sentry.environment || this.config.environment,
      });
    }

    // DataDog integration
    if (services.datadog?.apiKey) {
      const batchTransport = new BatchTransport(
        new ExternalTransport('datadog', {
          apiEndpoint: services.datadog.endpoint || 
            `https://http-intake.logs.${services.datadog.site || 'datadoghq.com'}/api/v2/logs`,
          apiKey: services.datadog.apiKey,
        }),
        10,  // batch size
        5000 // flush interval (5 seconds)
      );

      logger.addTransport(batchTransport);

      logger.info('DataDog logging transport configured', {
        batchEnabled: true,
        site: services.datadog.site || 'datadoghq.com',
      });
    }

    // File logging setup
    if (this.config.features?.enableFileLogging) {
      if (typeof window !== 'undefined') {
        // Browser environment - use ServerTransport to send logs to backend
        const serverTransport = new ServerTransport({
          endpoint: '/api/logs',
          batchSize: 5,
          flushInterval: 3000, // 3 seconds
          enableBuffering: true,
        });
        logger.addTransport(serverTransport);

        logger.info('Server logging transport configured (browser)', {
          endpoint: '/api/logs',
          buffering: true,
          environment: 'browser',
        });
      } else {
        // Node.js environment - use direct FileTransport
        const fileTransport = new FileTransport(this.config.fileLogging);
        logger.addTransport(fileTransport);

        logger.info('File logging transport configured (server)', {
          logDirectory: this.config.fileLogging?.logDirectory || 'logs',
          separateByLevel: this.config.fileLogging?.separateByLevel ?? true,
          rotateDaily: this.config.fileLogging?.rotateDaily ?? true,
          maxFileSize: this.config.fileLogging?.maxFileSize || '10MB',
        });
      }
    }
  }

  /**
   * Initialize tracing system
   */
  private initializeTracing(): void {
    if (!this.config.features?.enableTracing) return;

    const services = this.config.externalServices;

    // Jaeger integration
    if (services?.jaeger?.endpoint) {
      // Note: This would need actual Jaeger transport implementation
      logger.info('Jaeger tracing configured', {
        endpoint: services.jaeger.endpoint,
        serviceName: services.jaeger.serviceName || 'devnest-frontend',
      });
    }

    tracer.setEnabled(true);
    logger.debug('Tracing system initialized');
  }

  /**
   * Initialize metrics collection
   */
  private initializeMetrics(): void {
    if (!this.config.features?.enableMetrics) return;

    metrics.setEnabled(true);

    const services = this.config.externalServices;

    // Prometheus integration
    if (services?.prometheus?.endpoint) {
      // Note: This would need actual Prometheus transport implementation
      logger.info('Prometheus metrics configured', {
        endpoint: services.prometheus.endpoint,
      });
    }

    logger.debug('Metrics system initialized');
  }

  /**
   * Setup global error handling
   */
  private setupGlobalErrorHandling(): void {
    if (!this.config.features?.enableGlobalErrorHandling) return;

    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      const span = tracer.startSpan('global.error', {
        tags: {
          'error.type': 'javascript',
          'error.message': event.message,
          'error.filename': event.filename || 'unknown',
          'error.lineno': event.lineno?.toString() || '0',
          'error.colno': event.colno?.toString() || '0',
        },
      });

      logger.fatal('Global JavaScript error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error',
        traceId: span.getTraceId(),
        spanId: span.getSpanId(),
      });

      metricsUtils.trackError('JavaScriptError', 'GlobalHandler', 'high');
      span.finish();
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const span = tracer.startSpan('global.unhandled_rejection', {
        tags: {
          'error.type': 'unhandled_promise',
          'error.reason': String(event.reason),
        },
      });

      logger.error('Unhandled promise rejection', event.reason, {
        type: 'unhandled_rejection',
        reason: event.reason,
        traceId: span.getTraceId(),
        spanId: span.getSpanId(),
      });

      metricsUtils.trackError('UnhandledRejection', 'GlobalHandler', 'medium');
      span.finish();
    });

    logger.debug('Global error handlers configured');
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.features?.enablePerformanceMonitoring) return;

    // Track Web Vitals
    metricsUtils.trackWebVitals();

    // Memory usage monitoring (every 30 seconds)
    setInterval(() => {
      metricsUtils.trackMemoryUsage();
    }, 30000);

    // Navigation timing
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            logger.info('Navigation timing captured', {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              loadComplete: navigation.loadEventEnd - navigation.fetchStart,
              firstByte: navigation.responseStart - navigation.requestStart,
              domInteractive: navigation.domInteractive - navigation.fetchStart,
            }, 'PerformanceMonitoring');
          }
        }, 0);
      });
    }

    logger.debug('Performance monitoring configured');
  }

  /**
   * Get current configuration
   */
  getConfig(): ObservabilityConfig {
    return { ...this.config };
  }

  /**
   * Check if system is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const observabilityInitializer = ObservabilityInitializer.getInstance();

/**
 * Initialize observability with environment-based configuration
 */
export function initializeObservability(customConfig: Partial<ObservabilityConfig> = {}): void {
  const config: ObservabilityConfig = {
    // Environment-based defaults
    environment: import.meta.env.MODE as 'development' | 'production',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error' | 'fatal') || 
      (import.meta.env.DEV ? 'debug' : 'info'),
    enableConsoleLogging: import.meta.env.DEV,
    
    // External service configuration from environment
    externalServices: {
      ...(import.meta.env.VITE_SENTRY_DSN && {
        sentry: {
          dsn: import.meta.env.VITE_SENTRY_DSN,
          environment: import.meta.env.MODE,
        },
      }),
      ...(import.meta.env.VITE_DATADOG_API_KEY && {
        datadog: {
          apiKey: import.meta.env.VITE_DATADOG_API_KEY,
          site: import.meta.env.VITE_DATADOG_SITE || 'datadoghq.com',
        },
      }),
      ...(import.meta.env.VITE_JAEGER_ENDPOINT && {
        jaeger: {
          endpoint: import.meta.env.VITE_JAEGER_ENDPOINT,
          serviceName: 'devnest-frontend',
        },
      }),
      ...(import.meta.env.VITE_PROMETHEUS_ENDPOINT && {
        prometheus: {
          endpoint: import.meta.env.VITE_PROMETHEUS_ENDPOINT,
        },
      }),
    },

    // Merge custom configuration
    ...customConfig,
  };

  observabilityInitializer.initialize(config);
}

/**
 * Initialize observability for development (with debug settings)
 */
export function initializeDevObservability(): void {
  initializeObservability({
    logLevel: 'debug',
    enableConsoleLogging: true,
    features: {
      enableTracing: true,
      enableMetrics: true,
      enableGlobalErrorHandling: true,
      enablePerformanceMonitoring: false, // Disable for dev to reduce noise
    },
  });
}

/**
 * Initialize observability for production (with optimized settings)
 */
export function initializeProdObservability(): void {
  initializeObservability({
    logLevel: 'info',
    enableConsoleLogging: false,
    features: {
      enableTracing: true,
      enableMetrics: true,
      enableGlobalErrorHandling: true,
      enablePerformanceMonitoring: true,
    },
  });
}

export default {
  observabilityInitializer,
  initializeObservability,
  initializeDevObservability,
  initializeProdObservability,
};