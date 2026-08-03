# API Reference

Base URL: `http://localhost:4001` (local) — versioned endpoints are prefixed with `/api/v1`.

## Response Envelope

**Success:**
```json
{
  "success": true,
  "message": "Human-readable summary",
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "message": "What went wrong",
  "errors": [ ]
}
```
`errors` is only present for validation failures (400s from Zod), containing per-field details.

## Operational Endpoints (unversioned)

### `GET /health`
Liveness check. No dependency checks — always fast.

```json
{ "status": "ok", "service": "remitIQ-market-service", "version": "1.0.0" }
```

### `GET /health/ready`
Readiness check. Verifies database connectivity. Returns `503` if the database is unreachable.

```json
{
  "status": "ok",
  "service": "remitIQ-market-service",
  "version": "1.0.0",
  "checks": { "database": "ok" }
}
```

### `GET /metrics`
Prometheus-format metrics: default Node.js process metrics, HTTP request count/duration, FX sync outcome counters. Not versioned — matches standard Prometheus scraping conventions.

---

## Currencies

### `GET /api/v1/currencies`
Lists all currencies.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `active` | `boolean` | If `true`, only returns currencies with `isActive: true` |

### `GET /api/v1/currencies/:code`
Fetches a single currency by ISO 4217 code (case-insensitive).

**Errors:** `404` if the code doesn't match any currency.

---

## Providers

### `GET /api/v1/providers`
Lists all FX data providers (automated external sources, not users).

**Query params:** `active` (boolean, same as Currencies).

### `GET /api/v1/providers/:name`
Fetches a single provider by its unique name.

**Errors:** `404` if the name doesn't match any provider.

---

## Exchange Rates (official)

### `GET /api/v1/rates`
Lists all current official rates across all pairs and providers, with currency/provider details included.

### `GET /api/v1/rates/:base/:quote`
Lists all current rates for a specific currency pair, across all active providers, ordered by provider priority.

**Example:** `GET /api/v1/rates/USD/XAF`

**Errors:** `404` if either currency code is invalid, or no rate exists for the pair.

### `GET /api/v1/rates/:base/:quote/latest`
Returns the single most-preferred current rate for a pair (lowest-priority active provider).

**Errors:** `404` if no rate exists for the pair.

### `GET /api/v1/rates/:base/:quote/history`
Returns chronological (oldest-first) historical rate snapshots for a pair.

**Query params:**
| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `days` | `number` | `30` | `365` | Lookback window in days |

**Errors:** `400` if `days` isn't a positive number.

---

## Community Rates

User-submitted parallel/street-market rate observations. Unlike official rates, **many submissions can exist for the same pair** — there's no single "current" value.

### `POST /api/v1/community-rates`
Submits a new community rate observation.

**Body:**
```json
{
  "userId": "string, required",
  "baseCurrencyCode": "string, exactly 3 letters",
  "quoteCurrencyCode": "string, exactly 3 letters",
  "rate": "number, must be positive",
  "location": "string, optional, 1-100 chars"
}
```

**Response:** `201` with the created record.

**Errors:** `400` (validation failure), `404` (currency code well-formed but doesn't exist).

> **Note:** `userId` is currently accepted directly in the request body as a placeholder. This will be replaced with a JWT-derived userId once authentication against the Household Service is wired up.

### `GET /api/v1/community-rates/:base/:quote`
Lists community-submitted rates for a pair from the last 30 days, most recent first.

---

## Best Rate Comparison

Combines official and community rates to surface whichever is most favorable to the sender.

### `GET /api/v1/best-rate/:base/:quote`
Compares the latest official rate against the latest community rate for a pair, returning whichever has the higher value (more destination currency per unit sent = better for the sender). Ties resolve to the official rate.

**Response:**
```json
{
  "success": true,
  "message": "Best exchange rate fetched",
  "data": {
    "rate": 630,
    "source": "community",
    "location": "Douala",
    "submittedAt": "2026-08-01T09:29:17.331Z",
    "comparedTo": {
      "official": { "rate": 610.5, "provider": "ExchangeRate-API" },
      "community": { "rate": 630, "location": "Douala" }
    }
  }
}
```

`source` is `"official"` or `"community"`. `comparedTo` shows both sides even when only one exists (the missing side is `null`).

**Errors:** `404` if either currency code is invalid, or neither an official nor community rate exists for the pair.

---

## Alert Rules

User-defined thresholds that trigger when a currency pair's rate crosses a value.

### `POST /api/v1/alert-rules`
Creates a new alert rule.

**Body:**
```json
{
  "userId": "string, required",
  "baseCurrencyCode": "string, exactly 3 letters",
  "quoteCurrencyCode": "string, exactly 3 letters",
  "condition": "GREATER_THAN_OR_EQUAL | LESS_THAN_OR_EQUAL",
  "threshold": "number, must be positive"
}
```

**Response:** `201` with the created rule.

> **Note:** same `userId` caveat as Community Rates — placeholder until real auth exists.

### `GET /api/v1/alert-rules/:userId`
Lists all alert rules belonging to a user.

### `GET /api/v1/alert-rules/:id/events`
Lists all triggered events for a specific alert rule, most recent first.

**Errors:** `404` if the rule ID doesn't exist.

### `DELETE /api/v1/alert-rules/:id`
Deletes an alert rule.

**Response:** `204 No Content`.

**Errors:** `404` if the rule ID doesn't exist.

> **Note:** `AlertEvent.status` remains `PENDING` after creation — actual notification delivery (email/push/SMS) is not yet implemented, pending the Household Service owning user contact information.

---

## FX Sync Monitoring

### `GET /api/v1/sync/status`
Returns the outcome of the most recent FX Synchronization run.

```json
{
  "lastRunAt": "2026-08-01T17:14:07.942Z",
  "lastRunDurationMs": 4048,
  "lastRunSuccessCount": 4,
  "lastRunFailureCount": 0,
  "lastRunFailedCurrencies": [],
  "lastError": null,
  "isRunning": false
}
```

> Status is tracked in-memory per process — sufficient for a single-instance deployment. A multi-instance deployment would need this persisted centrally.

### `POST /api/v1/sync/trigger`
Manually triggers an FX sync run. Responds immediately (`202`) without waiting for completion — the sync runs in the background. Useful for testing or forcing a fresh sync on demand.

---

## Error Reference

| Status | Meaning | Typical cause |
|---|---|---|
| `400` | Bad Request | Zod validation failure, malformed query param |
| `404` | Not Found | Currency/provider/rate/rule doesn't exist |
| `500` | Internal Server Error | Unexpected error; details hidden in production |
| `503` | Service Unavailable | `/health/ready` only — database unreachable |