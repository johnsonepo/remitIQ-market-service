import client from 'prom-client';

/**
 * Shared Prometheus metrics registry for the application.
 */
export const metricsRegistry = new client.Registry();

// Collects default Node.js process metrics (memory, CPU, event loop
// lag, GC) automatically, prefixed to avoid collisions with custom
// metrics below.
client.collectDefaultMetrics({ register: metricsRegistry, prefix: 'remitiq_market_' });

/**
 * HTTP request counter, labeled by method, route, and status code.
 */
export const httpRequestCounter = new client.Counter({
  name: 'remitiq_market_http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

/**
 * HTTP request duration histogram, labeled by method, route, and
 * status code. Buckets tuned for a typical API service (sub-second
 * to a few seconds).
 */
export const httpRequestDuration = new client.Histogram({
  name: 'remitiq_market_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

/**
 * FX Synchronization job outcome counter, labeled by result
 * (success/failure) and currency code, so dashboards can show sync
 * health over time and identify consistently-failing currencies.
 */
export const fxSyncCounter = new client.Counter({
  name: 'remitiq_market_fx_sync_total',
  help: 'Total number of FX sync attempts per currency, by outcome',
  labelNames: ['currency', 'result'],
  registers: [metricsRegistry],
});