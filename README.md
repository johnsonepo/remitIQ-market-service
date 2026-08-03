# RemitIQ Market Service

> Market Intelligence Microservice for the [RemitIQ Ecosystem](../README.md)

[![CI](https://github.com/johnsonepo/remitIQ-market-service/actions/workflows/ci.yml/badge.svg)](https://github.com/johnsonepo/remitIQ-market-service/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## What is this?

The Market Service owns everything related to currency exchange rate intelligence for RemitIQ:

- **Exchange rates** — official rates fetched daily from an external FX API
- **Community rates** — user-submitted parallel/street-market rates (e.g. informal exchanges), which often diverge meaningfully from official rates
- **Best rate comparison** — surfaces whichever source (official or community) is more favorable for a given currency pair
- **Historical rates** — time-series snapshots for trend analysis
- **Exchange rate alerts** — user-defined thresholds that trigger when crossed

This service **does not** move money, manage users, or handle authentication — see [Architecture](./docs/ARCHITECTURE.md) for the full data-ownership boundaries.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22, TypeScript |
| Framework | Express 5 |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Validation | Zod |
| Testing | Vitest, Supertest |
| Scheduling | node-cron |
| Metrics | prom-client (Prometheus) |
| Containerization | Docker (multi-stage) |
| CI/CD | GitHub Actions |

## Quick Start

**Prerequisites:** Docker and Docker Compose.

```bash
# 1. Clone and enter the repo
git clone https://github.com/johnsonepo/remitIQ-market-service.git
cd remitIQ-market-service

# 2. Copy the example env file and fill in your values
cp .env.example .env

# 3. Start the stack (Express API + PostgreSQL)
docker compose up -d --build

# 4. Apply database migrations
docker compose exec market-service npx prisma migrate deploy

# 5. Seed reference data (currencies, providers, sample rates)
docker compose exec market-service npm run prisma:seed

# 6. Confirm it's running
curl http://localhost:4001/health
```

You should see:
```json
{"status":"ok","service":"remitIQ-market-service","version":"1.0.0"}
```

## Documentation

- **[API Reference](./docs/API.md)** — every endpoint, request/response shapes, error formats
- **[Architecture](./docs/ARCHITECTURE.md)** — module structure, data model, key design decisions
- **[Development Guide](./docs/DEVELOPMENT.md)** — local setup, testing, common workflows, troubleshooting
- **[Deployment Guide](./docs/DEPLOYMENT.md)** — Docker, environment variables, CI/CD


## Project Structure

src/
├── app.ts # Express app: middleware, routes, error handling
├── server.ts # Entry point: starts the HTTP server + scheduled jobs
├── clients/ # External service clients (Prisma, ExchangeRate-API)
├── config/ # Environment validation, app/database/logger config
├── controllers/ # Request handlers per resource
├── jobs/ # Scheduled background jobs (FX sync)
├── middlewares/ # Express middleware (errors, validation, metrics, logging)
├── repositories/ # Data access layer, one per Prisma model
├── routes/ # Route definitions, one file per resource
├── services/ # Business logic that spans multiple repositories
├── utils/ # Shared utilities (ApiError, ApiResponse, asyncHandler)
└── validators/ # Zod schemas for request validation

prisma/
├── schema.prisma # Database schema
├── migrations/ # Version-controlled schema migrations
└── seeders/ # Seed data scripts

tests/
├── unit/ # Isolated logic tests (mocked dependencies)
├── integration/ # Repository tests against a real test database
└── api/ # Full HTTP request/response tests


## License

MIT — see [LICENSE](./LICENSE).