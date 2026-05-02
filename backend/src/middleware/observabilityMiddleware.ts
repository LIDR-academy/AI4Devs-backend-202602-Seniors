import { Request, Response, NextFunction } from 'express';
import { performance } from 'node:perf_hooks';

// Structured logging with levels
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  duration?: number;
  statusCode?: number;
  error?: string;
}

// Simple in-memory metrics (in production, use Prometheus)
const metrics = {
  requestCount: 0,
  errorCount: 0,
  successCount: 0,
  totalDuration: 0,
  requestsByEndpoint: {} as Record<string, number>,
  errorsByStatusCode: {} as Record<number, number>,
};

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  // In production, send to centralized logging (e.g., ELK Stack, DataDog, Splunk)
  console.log(JSON.stringify(entry));
}

export const logDebug = (message: string, context?: Record<string, unknown>): void => {
  log(LogLevel.DEBUG, message, context);
};

export const logInfo = (message: string, context?: Record<string, unknown>): void => {
  log(LogLevel.INFO, message, context);
};

export const logWarn = (message: string, context?: Record<string, unknown>): void => {
  log(LogLevel.WARN, message, context);
};

export const logError = (message: string, context?: Record<string, unknown>): void => {
  log(LogLevel.ERROR, message, context);
};

/**
 * Returns a low-cardinality route label for metrics.
 * Prefers the Express-matched template (req.baseUrl + req.route.path) when available,
 * otherwise sanitizes numeric/UUID path segments to :id placeholders.
 */
function normalizeEndpointPath(req: Request): string {
  if (req.route?.path) {
    return (req.baseUrl ?? '') + req.route.path;
  }
  return req.path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

/**
 * Middleware to track API request metrics and performance
 */
export const observabilityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = performance.now();

  // Track endpoint using a normalized, low-cardinality key
  const endpoint = `${req.method} ${normalizeEndpointPath(req)}`;
  metrics.requestCount++;
  metrics.requestsByEndpoint[endpoint] = (metrics.requestsByEndpoint[endpoint] || 0) + 1;

  // Log incoming request
  logInfo('API Request received', {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: unknown) {
    const duration = performance.now() - startTime;
    metrics.totalDuration += duration;

    const statusCode = res.statusCode;

    // Track success/error
    if (statusCode >= 400) {
      metrics.errorCount++;
      metrics.errorsByStatusCode[statusCode] = (metrics.errorsByStatusCode[statusCode] || 0) + 1;

      logWarn('API Request failed', {
        method: req.method,
        path: req.path,
        statusCode,
        duration: Math.round(duration),
        userId: req.user?.id,
      });
    } else {
      metrics.successCount++;

      if (duration > 500) {
        logWarn('API Request slow', {
          method: req.method,
          path: req.path,
          statusCode,
          duration: Math.round(duration),
          userId: req.user?.id,
        });
      } else {
        logDebug('API Request completed', {
          method: req.method,
          path: req.path,
          statusCode,
          duration: Math.round(duration),
        });
      }
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to track stage update operations specifically
 */
export const stagUpdateObservabilityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method === 'PUT' && req.path.includes('/stage')) {
    const startTime = performance.now();

    const originalSend = res.send;
    res.send = function (data: unknown) {
      const duration = performance.now() - startTime;

      if (res.statusCode === 200) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let body: any;
        try {
          body = typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
          logWarn('Failed to parse response body for observability logging', {
            path: req.path,
            statusCode: res.statusCode,
          });
          body = null;
        }

        logInfo('Candidate stage updated successfully', {
          applicationId: body?.applicationId,
          candidateId: body?.candidateId,
          userId: req.user?.id,
          newStage: body?.currentInterviewStep?.stepName,
          duration: Math.round(duration),
          statusCode: 200,
        });

        // Metrics for success
        recordStageUpdateMetric('success', duration);
      } else if (res.statusCode >= 400) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let body: any;
        try {
          body = typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
          logWarn('Failed to parse response body for observability logging', {
            path: req.path,
            statusCode: res.statusCode,
          });
          body = null;
        }

        logWarn('Candidate stage update failed', {
          userId: req.user?.id,
          statusCode: res.statusCode,
          error: body?.error,
          duration: Math.round(duration),
        });

        // Metrics for failure
        recordStageUpdateMetric('failure', duration);
      }

      return originalSend.call(this, data);
    };
  }

  next();
};

// Stage update specific metrics
const stageUpdateMetrics = {
  totalUpdates: 0,
  successCount: 0,
  failureCount: 0,
  totalDuration: 0,
  errorsByType: {} as Record<string, number>,
};

function recordStageUpdateMetric(status: 'success' | 'failure', duration: number): void {
  stageUpdateMetrics.totalUpdates++;
  stageUpdateMetrics.totalDuration += duration;

  if (status === 'success') {
    stageUpdateMetrics.successCount++;
  } else {
    stageUpdateMetrics.failureCount++;
  }
}

/**
 * Get current metrics
 */
export const getMetrics = (): Record<string, unknown> => {
  const avgDuration = metrics.requestCount > 0
    ? Math.round(metrics.totalDuration / metrics.requestCount)
    : 0;

  const stageUpdateAvgDuration = stageUpdateMetrics.totalUpdates > 0
    ? Math.round(stageUpdateMetrics.totalDuration / stageUpdateMetrics.totalUpdates)
    : 0;

  return {
    general: {
      totalRequests: metrics.requestCount,
      successCount: metrics.successCount,
      errorCount: metrics.errorCount,
      avgDurationMs: avgDuration,
      successRate: metrics.requestCount > 0
        ? Math.round((metrics.successCount / metrics.requestCount) * 100)
        : 0,
      errorsByStatusCode: metrics.errorsByStatusCode,
    },
    stageUpdate: {
      totalUpdates: stageUpdateMetrics.totalUpdates,
      successCount: stageUpdateMetrics.successCount,
      failureCount: stageUpdateMetrics.failureCount,
      avgDurationMs: stageUpdateAvgDuration,
      successRate: stageUpdateMetrics.totalUpdates > 0
        ? Math.round((stageUpdateMetrics.successCount / stageUpdateMetrics.totalUpdates) * 100)
        : 0,
    },
    requestsByEndpoint: metrics.requestsByEndpoint,
  };
};

/**
 * Health check endpoint
 */
export const getHealthStatus = (): Record<string, unknown> => {
  const metricsData = getMetrics();
  const general = metricsData.general as any;
  const errorCount = general?.errorCount ?? 0;
  const totalRequests = general?.totalRequests ?? 1;
  const avgDurationMs = general?.avgDurationMs ?? 0;

  const errorRate = errorCount > 0
    ? (errorCount / totalRequests) * 100
    : 0;

  const isHealthy = errorRate < 5 && avgDurationMs < 2000;

  return {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    metrics: metricsData,
    errorRate: Math.round(errorRate),
    avgResponseTime: avgDurationMs,
    featureFlags: {
      CANDIDATE_STAGE_UPDATE: process.env.FEATURE_CANDIDATE_STAGE_UPDATE ?? '0',
      FEATURE_POSITION_CANDIDATES_ENDPOINT: process.env.FEATURE_POSITION_CANDIDATES_ENDPOINT ?? '0',
    },
  };
};

/**
 * Error alerting function (in production, send to alerting service)
 */
export function checkAndAlert(context: Record<string, unknown>): void {
  const metricsData = getMetrics();
  const general = metricsData.general as any;
  const errorCount = general?.errorCount ?? 0;
  const totalRequests = general?.totalRequests ?? 1;
  const avgDurationMs = general?.avgDurationMs ?? 0;
  const errorRate = errorCount / Math.max(1, totalRequests);

  if (errorRate > 0.05) { // 5% threshold
    logError('HIGH ERROR RATE ALERT', {
      errorRate: Math.round(errorRate * 100),
      totalRequests,
      errorCount,
      context,
    });
    // In production: alert PagerDuty or Slack
  }

  if (avgDurationMs > 2000) {
    logWarn('SLOW RESPONSE TIME ALERT', {
      avgDurationMs,
      context,
    });
    // In production: alert monitoring system
  }
}
