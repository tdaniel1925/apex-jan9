/**
 * Performance Monitoring Utilities
 * Track timing metrics for auth and page load operations
 */

export interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  start(operation: string): void {
    if (!this.enabled) return;

    this.metrics.set(operation, {
      operation,
      startTime: performance.now(),
    });
  }

  end(operation: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(operation);
    if (!metric) {
      console.warn(`No start time found for operation: ${operation}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations
    if (duration > 1000) {
      console.warn(`[PERF] Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
    } else if (duration > 500) {
      console.info(`[PERF] ${operation} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  reset(): void {
    this.metrics.clear();
  }

  logSummary(): void {
    if (!this.enabled) return;

    const metrics = this.getMetrics();
    if (metrics.length === 0) return;

    console.group('[PERF] Performance Summary');
    metrics.forEach(metric => {
      if (metric.duration) {
        console.log(`${metric.operation}: ${metric.duration.toFixed(2)}ms`);
      }
    });
    console.groupEnd();
  }
}

export const perfMonitor = new PerformanceMonitor();

// Helper to measure async operations
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  perfMonitor.start(operation);
  try {
    const result = await fn();
    perfMonitor.end(operation);
    return result;
  } catch (error) {
    perfMonitor.end(operation);
    throw error;
  }
}

// Helper to measure sync operations
export function measure<T>(
  operation: string,
  fn: () => T
): T {
  perfMonitor.start(operation);
  try {
    const result = fn();
    perfMonitor.end(operation);
    return result;
  } catch (error) {
    perfMonitor.end(operation);
    throw error;
  }
}
