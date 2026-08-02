import type { NextFunction, Request, Response } from 'express';

import { httpRequestCounter, httpRequestDuration } from '../utils/metrics.js';

/**
 * Records HTTP request count and duration metrics for every request.
 *
 * Uses req.route?.path when available (the matched Express route
 * pattern, e.g. "/currencies/:code") rather than req.path (the
 * literal URL, e.g. "/currencies/USD") to avoid unbounded metric
 * cardinality from unique parameter values.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startTime;
    const durationSeconds = Number(durationNs) / 1e9;

    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, durationSeconds);
  });

  next();
}