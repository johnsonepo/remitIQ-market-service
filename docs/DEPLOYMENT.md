# Deployment Guide

## Docker Images

This project uses a multi-stage `Dockerfile` with four targets:

| Stage | Purpose |
|---|---|
| `dependencies` | Installs all npm packages (base for other stages) |
| `development` | `tsx watch`, live-reload, used by `docker-compose.yml` locally |
| `builder` | Generates the Prisma client, compiles TypeScript (`tsc`) |
| `production` | Minimal runtime image: compiled JS + generated Prisma client + prod-only deps |

**Build the production image directly:**
```bash
docker build --target production -t remitiq-market-service:latest .
```

The production stage:
- Runs as the built-in non-root `node` user (uid 1000), not root
- Copies the Prisma client already generated in `builder` rather than regenerating it
- Includes a `HEALTHCHECK` hitting `GET /health`
- Uses `NODE_OPTIONS=--dns-result-order=ipv4first` to avoid IPv6 connectivity issues in restrictive Docker network environments

## Environment Variables

All variables are validated at startup via `src/config/env.ts` (Zod schema) — the app **will not start** if any required variable is missing or invalid.

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NODE_ENV` | Yes | `production` | `development` \| `test` \| `production` |
| `PORT` | Yes | `4001` | |
| `APP_NAME` | Yes | `remitIQ-market-service` | |
| `APP_VERSION` | Yes | `1.0.0` | |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/db` | Prisma connection string |
| `DATABASE_URL_TEST` | Test only | `postgresql://user:pass@host:5432/db_test` | Used by the test suite, not production |
| `LOG_LEVEL` | Yes | `info` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` |
| `FX_API_URL` | Yes | `https://v6.exchangerate-api.com/v6` | Base URL for the FX provider |
| `FX_API_KEY` | Optional | — | Required for the FX sync job to actually fetch rates |
| `JWT_SECRET` | Yes | (min 16 chars) | Not yet used for validation — reserved for when Household Service auth is wired in |
| `CORS_ORIGIN` | Yes | `https://app.remitiq.com` | Must be a valid URL |

**Never commit `.env`** — use `.env.example` as the template and set real values via your hosting platform's secret manager in production.

## Running in Production

**Minimum required steps on a fresh deploy:**

```bash
docker build --target production -t remitiq-market-service:latest .

docker run -d \
  --name remitiq-market-service \
  -p 4001:4001 \
  -e NODE_ENV=production \
  -e PORT=4001 \
  -e APP_NAME=remitIQ-market-service \
  -e APP_VERSION=1.0.0 \
  -e DATABASE_URL="postgresql://..." \
  -e LOG_LEVEL=info \
  -e FX_API_URL=https://v6.exchangerate-api.com/v6 \
  -e FX_API_KEY="..." \
  -e JWT_SECRET="..." \
  -e CORS_ORIGIN="https://app.remitiq.com" \
  remitiq-market-service:latest

# Apply migrations against the production database (run once per deploy with schema changes)
docker exec remitiq-market-service npx prisma migrate deploy
```

On startup in `NODE_ENV=production`, the FX sync scheduler runs **immediately once**, then daily at 01:00 UTC — so a fresh deploy doesn't wait up to 24h for its first sync.

## Health Checks for Orchestrators

| Endpoint | Purpose | Use for |
|---|---|---|
| `GET /health` | Liveness — process is up, no dependency checks | Container restart decisions |
| `GET /health/ready` | Readiness — database is reachable | Load balancer traffic routing (returns `503` when not ready) |

Docker's own `HEALTHCHECK` (baked into the production image) hits `/health` every 30 seconds.

## Monitoring

`GET /metrics` exposes Prometheus-format metrics:
- Default Node.js process metrics (memory, CPU, event loop lag, GC)
- `remitiq_market_http_requests_total` — request count by method/route/status
- `remitiq_market_http_request_duration_seconds` — request duration histogram
- `remitiq_market_fx_sync_total` — FX sync outcomes by currency/result

Point a Prometheus scrape config at this endpoint; pairs naturally with Loki for log aggregation (structured JSON logs via Pino, see `src/utils/logger.ts`).

`GET /api/v1/sync/status` gives a quick JSON snapshot of the most recent FX sync run without needing a full metrics stack — useful for a lightweight dashboard or manual checks.

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on every push and pull request to `main`, with three jobs:

| Job | What it checks | Depends on |
|---|---|---|
| `lint-and-typecheck` | ESLint + full `tsc` build | — |
| `test` | Full Vitest suite against a throwaway Postgres service | `lint-and-typecheck` |
| `docker-build` | Production Dockerfile target actually builds | `lint-and-typecheck` |

**Why `lint-and-typecheck` runs first and blocks the others:** `npm run dev` (via `tsx watch`) never type-checks — only `npm run build` does. Real `tsc` errors can silently accumulate during day-to-day development without ever surfacing until someone runs a full build. Failing fast here saves CI minutes on the other two jobs when the code doesn't even compile.

**Required GitHub repo secret:** `FX_API_KEY` (Settings → Secrets and variables → Actions).

**What CI does NOT currently cover:** a full runtime smoke test of the production image against a live database (the `docker-build` job only verifies the image *builds*, not that it starts and serves requests correctly). This was verified manually once — see the commit history — but isn't automated yet. Worth adding if this becomes a recurring risk area.

## Deployment Checklist

Before deploying a new version:

- [ ] `npm run lint` and `npx tsc --noEmit` both pass locally
- [ ] `npm run test` passes locally
- [ ] CI is green on the target commit
- [ ] Any new environment variables are documented above and set in the target environment
- [ ] Any schema changes have a corresponding migration in `prisma/migrations/`
- [ ] `docker build --target production` succeeds locally as a final sanity check