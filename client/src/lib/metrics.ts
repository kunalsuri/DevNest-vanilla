/**
 * Comprehensive Metrics System for React + TypeScript Applications
 * 
 * Features:
 * - Performance metrics (timing, counters, gauges, histograms)
 * - Component render time tracking
 * - API request latency and success/failure rates
 * - Error rate monitoring
 * - Custom business metrics
 * - Integration with external monitoring systems (Prometheus, DataDog)
 */

import { logger } from './logger';
import { traceContext } from './tracing';

// Metric types
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
}

// Metric data structures
export interface MetricData {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  unit?: string;
  description?: string;
}

export interface CounterMetric extends MetricData {
  type: MetricType.COUNTER;
}

export interface GaugeMetric extends MetricData {
  type: MetricType.GAUGE;
}

export interface HistogramMetric extends MetricData {
  type: MetricType.HISTOGRAM;
  buckets?: number[];
}

export interface TimerMetric extends MetricData {
  type: MetricType.TIMER;
  duration: number;
}

// Metric collection interface
export interface MetricsTransport {
  name: string;
  reportMetric(metric: MetricData): Promise<void>;
  reportBatch(metrics: MetricData[]): Promise<void>;
}

// Console metrics transport for development
export class ConsoleMetricsTransport implements MetricsTransport {
  name = 'console-metrics';

  async reportMetric(metric: MetricData): Promise<void> {
    if (import.meta.env.DEV) {
      console.log(`📊 ${metric.type.toUpperCase()}: ${metric.name}`, {
        value: metric.value,
        tags: metric.tags,
        unit: metric.unit,
      });
    }
  }

  async reportBatch(metrics: MetricData[]): Promise<void> {
    if (import.meta.env.DEV && metrics.length > 0) {
      console.group('📊 Metrics Batch');
      for (const metric of metrics) {
        await this.reportMetric(metric);
      }
      console.groupEnd();
    }
  }
}

// Prometheus metrics transport
export class PrometheusTransport implements MetricsTransport {
  name = 'prometheus';
  private config: {
    endpoint: string;
    jobName?: string;
    instance?: string;
  };

  constructor(config: typeof PrometheusTransport.prototype.config) {
    this.config = {
      jobName: 'devnest_frontend',
      instance: window.location.host,
      ...config,
    };
  }

  async reportMetric(metric: MetricData): Promise<void> {
    await this.reportBatch([metric]);
  }

  async reportBatch(metrics: MetricData[]): Promise<void> {
    try {
      const payload = this.formatForPrometheus(metrics);
      
      await fetch(`${this.config.endpoint}/metrics/job/${this.config.jobName}/instance/${this.config.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: payload,
      });
    } catch (error) {
      logger.warn('Failed to send metrics to Prometheus', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Metrics');
    }
  }

  private formatForPrometheus(metrics: MetricData[]): string {
    return metrics
      .map(metric => {
        const tags = Object.entries(metric.tags)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        
        const metricName = metric.name.replace(/[^a-zA-Z0-9_]/g, '_');
        const tagString = tags ? `{${tags}}` : '';
        
        return `${metricName}${tagString} ${metric.value} ${metric.timestamp}`;
      })
      .join('\n');
  }
}

// External metrics transport (DataDog, etc.)
export class ExternalMetricsTransport implements MetricsTransport {
  name: string;
  private config: {
    endpoint: string;
    apiKey?: string;
    service?: string;
    environment?: string;
  };

  constructor(name: string, config: typeof ExternalMetricsTransport.prototype.config) {
    this.name = name;
    this.config = {
      service: 'devnest-frontend',
      environment: import.meta.env.MODE,
      ...config,
    };
  }

  async reportMetric(metric: MetricData): Promise<void> {
    await this.reportBatch([metric]);
  }

  async reportBatch(metrics: MetricData[]): Promise<void> {
    try {
      const payload = {
        series: metrics.map(metric => ({
          metric: metric.name,
          type: metric.type,
          points: [[metric.timestamp, metric.value]],
          tags: Object.entries(metric.tags).map(([key, value]) => `${key}:${value}`),
          host: window.location.host,
          service: this.config.service,
          env: this.config.environment,
        })),
      };

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { 'DD-API-KEY': this.config.apiKey } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.warn('Failed to send metrics to external service', { 
        error: error instanceof Error ? error.message : String(error),
        service: this.name 
      }, 'Metrics');
    }
  }
}

// Histogram for tracking value distributions
export class Histogram {
  private buckets: Map<number, number> = new Map();
  private bucketBounds: number[];
  private sum = 0;
  private count = 0;

  constructor(buckets: number[] = [0.1, 0.5, 1, 2.5, 5, 10]) {
    this.bucketBounds = [...buckets, Infinity].sort((a, b) => a - b);
    this.bucketBounds.forEach(bucket => this.buckets.set(bucket, 0));
  }

  record(value: number): void {
    this.sum += value;
    this.count++;

    for (const bound of this.bucketBounds) {
      if (value <= bound) {
        this.buckets.set(bound, (this.buckets.get(bound) || 0) + 1);
        break;
      }
    }
  }

  getPercentile(percentile: number): number {
    const targetCount = Math.ceil((percentile / 100) * this.count);
    let currentCount = 0;

    for (const bound of this.bucketBounds) {
      const count = this.buckets.get(bound) || 0;
      currentCount += count;
      if (currentCount >= targetCount) {
        return bound === Infinity ? this.sum / this.count : bound;
      }
    }

    return 0;
  }

  getAverage(): number {
    return this.count > 0 ? this.sum / this.count : 0;
  }

  getCount(): number {
    return this.count;
  }

  getBuckets(): Map<number, number> {
    return new Map(this.buckets);
  }

  reset(): void {
    this.buckets.clear();
    this.bucketBounds.forEach(bucket => this.buckets.set(bucket, 0));
    this.sum = 0;
    this.count = 0;
  }
}

// Main metrics collector
export class MetricsCollector {
  private transports: Map<string, MetricsTransport> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private enabled = true;
  private batchBuffer: MetricData[] = [];
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Add default console transport in development
    if (import.meta.env.DEV) {
      this.addTransport(new ConsoleMetricsTransport());
    }

    // Start batch flushing
    this.startBatchFlushing();
  }

  // Add metrics transport
  addTransport(transport: MetricsTransport): void {
    this.transports.set(transport.name, transport);
  }

  // Remove metrics transport
  removeTransport(name: string): void {
    this.transports.delete(name);
  }

  // Enable/disable metrics collection
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Configure batching
  setBatchConfig(batchSize: number, flushInterval: number): void {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.startBatchFlushing();
    }
  }

  // Start batch flushing timer
  private startBatchFlushing(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // Create metric with common tags
  private createMetric(
    name: string,
    type: MetricType,
    value: number,
    tags: Record<string, string> = {},
    unit?: string
  ): MetricData {
    const traceId = traceContext.getCurrentTraceId();
    const spanId = traceContext.getCurrentSpanId();

    return {
      name,
      type,
      value,
      timestamp: Date.now(),
      tags: {
        environment: import.meta.env.MODE || 'development',
        service: 'devnest-frontend',
        version: import.meta.env.VITE_APP_VERSION || 'unknown',
        ...(traceId ? { trace_id: traceId } : {}),
        ...(spanId ? { span_id: spanId } : {}),
        ...tags,
      },
      unit,
    };
  }

  // Report metric to transports
  private async reportMetric(metric: MetricData): Promise<void> {
    if (!this.enabled) return;

    // Add to batch buffer
    this.batchBuffer.push(metric);

    // Flush if batch is full
    if (this.batchBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  // Flush batch buffer
  async flush(): Promise<void> {
    if (this.batchBuffer.length === 0) return;

    const metricsToFlush = [...this.batchBuffer];
    this.batchBuffer = [];

    const promises = Array.from(this.transports.values()).map(transport =>
      transport.reportBatch(metricsToFlush).catch(error =>
        logger.error('Metrics transport error', error as Error, { 
          transport: transport.name 
        }, 'Metrics')
      )
    );

    await Promise.allSettled(promises);
  }

  // Counter methods
  incrementCounter(name: string, tags: Record<string, string> = {}, value = 1): void {
    const key = `${name}:${JSON.stringify(tags)}`;
    const currentValue = this.counters.get(key) || 0;
    const newValue = currentValue + value;
    this.counters.set(key, newValue);

    const metric = this.createMetric(name, MetricType.COUNTER, newValue, tags);
    this.reportMetric(metric);
  }

  // Gauge methods
  setGauge(name: string, value: number, tags: Record<string, string> = {}, unit?: string): void {
    const key = `${name}:${JSON.stringify(tags)}`;
    this.gauges.set(key, value);

    const metric = this.createMetric(name, MetricType.GAUGE, value, tags, unit);
    this.reportMetric(metric);
  }

  // Histogram methods
  recordHistogram(name: string, value: number, tags: Record<string, string> = {}, unit?: string): void {
    const key = `${name}:${JSON.stringify(tags)}`;
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, new Histogram());
    }
    
    const histogram = this.histograms.get(key)!;
    histogram.record(value);

    const metric = this.createMetric(name, MetricType.HISTOGRAM, value, tags, unit);
    this.reportMetric(metric);
  }

  // Timer methods
  startTimer(name: string, tags: Record<string, string> = {}): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordTimer(name, duration, tags);
    };
  }

  recordTimer(name: string, duration: number, tags: Record<string, string> = {}): void {
    const metric = this.createMetric(name, MetricType.TIMER, duration, tags, 'ms');
    this.reportMetric(metric);
    
    // Also record in histogram for percentile calculations
    this.recordHistogram(`${name}.duration`, duration, tags, 'ms');
  }

  // Get current metric values
  getCounter(name: string, tags: Record<string, string> = {}): number {
    const key = `${name}:${JSON.stringify(tags)}`;
    return this.counters.get(key) || 0;
  }

  getGauge(name: string, tags: Record<string, string> = {}): number {
    const key = `${name}:${JSON.stringify(tags)}`;
    return this.gauges.get(key) || 0;
  }

  getHistogram(name: string, tags: Record<string, string> = {}): Histogram | null {
    const key = `${name}:${JSON.stringify(tags)}`;
    return this.histograms.get(key) || null;
  }

  // Clear all metrics
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.batchBuffer = [];
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
    this.clear();
  }
}

// Global metrics collector
export const metrics = new MetricsCollector();

// Utility functions for common metrics
export const metricsUtils = {
  // Track API performance
  trackApiCall: (method: string, endpoint: string, duration: number, status: number): void => {
    metrics.incrementCounter('api.requests.total', {
      method,
      endpoint,
      status: status.toString(),
    });

    metrics.recordTimer('api.request.duration', duration, {
      method,
      endpoint,
    });

    if (status >= 400) {
      metrics.incrementCounter('api.errors.total', {
        method,
        endpoint,
        status: status.toString(),
      });
    }
  },

  // Track component performance
  trackComponentRender: (componentName: string, duration: number, props?: Record<string, any>): void => {
    metrics.recordTimer('component.render.duration', duration, {
      component: componentName,
    });

    if (props) {
      metrics.setGauge('component.props.count', Object.keys(props).length, {
        component: componentName,
      });
    }
  },

  // Track user interactions
  trackUserAction: (action: string, metadata: Record<string, string> = {}): void => {
    metrics.incrementCounter('user.actions.total', {
      action,
      ...metadata,
    });
  },

  // Track errors
  trackError: (errorType: string, component?: string, severity: 'low' | 'medium' | 'high' = 'medium'): void => {
    metrics.incrementCounter('errors.total', {
      type: errorType,
      ...(component ? { component } : {}),
      severity,
    });
  },

  // Track business metrics
  trackBusinessMetric: (name: string, value: number, tags: Record<string, string> = {}): void => {
    metrics.setGauge(`business.${name}`, value, tags);
  },

  // Track performance vitals
  trackWebVitals: (): void => {
    // Track Core Web Vitals if available
    if ('web-vitals' in window) {
      // This would integrate with web-vitals library
      // For now, we'll track basic performance metrics
    }

    // Track basic performance metrics using Performance API
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        metrics.recordTimer('page.load.total', navigationEntry.loadEventEnd - navigationEntry.startTime);
        metrics.recordTimer('page.load.dom', navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime);
        metrics.recordTimer('page.load.first_paint', navigationEntry.domContentLoadedEventStart - navigationEntry.startTime);
      }
    } catch (error) {
      logger.debug('Performance navigation timing not available', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Metrics');
    }
  },

  // Track memory usage
  trackMemoryUsage: (): void => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.setGauge('memory.used', memory.usedJSHeapSize, {}, 'bytes');
      metrics.setGauge('memory.total', memory.totalJSHeapSize, {}, 'bytes');
      metrics.setGauge('memory.limit', memory.jsHeapSizeLimit, {}, 'bytes');
    }
  },

  // Create custom timer
  createTimer: (name: string, tags: Record<string, string> = {}) => {
    return metrics.startTimer(name, tags);
  },
};