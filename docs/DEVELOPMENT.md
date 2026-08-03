# Development Guide

## Prerequisites

- Docker and Docker Compose
- Git

You don't need Node.js installed locally — everything runs inside Docker.

## First-Time Setup

```bash
git clone https://github.com/johnsonepo/remitIQ-market-service.git
cd remitIQ-market-service

cp .env.example .env
# Edit .env: set POSTGRES_*, JWT_SECRET, FX_API_KEY (see below)

docker compose up -d --build
docker compose exec market-service npx prisma migrate deploy
docker compose exec market-service npm run prisma:seed
```

### Getting an FX API key

`FX_API_KEY` is required for the FX Synchronization job to fetch real rates. Get a free key at [exchangerate-api.com](https://www.exchangerate-api.com/) and set:

```dotenv
FX_API_URL=https://v6.exchangerate-api.com/v6
FX_API_KEY=your-key-here
```

Without a key, most of the API still works (seeded data is available), but `POST /api/v1/sync/trigger` and the scheduled sync will fail.

## Daily Workflow

The `development` Docker target runs `tsx watch`, which live-reloads on file changes — **no rebuild needed for code edits**:

```bash
docker compose up -d
docker compose logs -f market-service
```

**When you DO need to rebuild:**
| Change | Command |
|---|---|
| Edited `.ts` files only | Nothing — `tsx watch` picks it up |
| Added/changed a dependency (`package.json`) | `docker compose up -d --build` |
| Changed `Dockerfile` or `docker-compose.yml` structure | `docker compose down -v && docker compose build --no-cache market-service && docker compose up -d` |
| Suspect stale cache / weird behavior | `docker compose build --no-cache market-service` |

> **Known issue:** the anonymous `node_modules` Docker volume can go stale after adding a new dependency — the image rebuilds correctly, but the old volume gets remounted over it. If a freshly-installed package reports `Cannot find module`, run the full `down -v && build --no-cache` cycle above (note: this also wipes your local database — re-run migrate + seed afterward).

## Database

**Schema changes:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate + apply a migration
docker compose exec market-service npx prisma migrate dev --name descriptive_name
```

**Reset local data:**
```bash
docker compose down -v   # wipes market_postgres_data
docker compose up -d
docker compose exec market-service npx prisma migrate deploy
docker compose exec market-service npm run prisma:seed
```

**Direct database access:**
```bash
docker compose exec market-db psql -U <POSTGRES_USER> -d market_db
```

## Testing

Tests run against a **separate database** (`market_db_test`, same Postgres instance, different database name) — never your dev data.

```bash
# One-time: create the test database
docker compose exec market-db createdb -U <POSTGRES_USER> market_db_test

# Run the full suite
docker compose exec market-service npm run test

# Watch mode
docker compose exec market-service npm run test:watch
```

Test files run **sequentially** (not in parallel) since they share one physical test database — expect the full suite to take under a minute.

**Test layout:**

tests/
├── unit/ mocked dependencies, no DB, milliseconds each
├── integration/ real repository, real test DB, ~1-2s each
└── api/ full HTTP cycle via supertest, real test DB


Add new tests following the existing pattern for each layer — see any file in `tests/unit/` or `tests/integration/` as a template.

## Linting & Type Checking

```bash
docker compose exec market-service npm run lint
docker compose exec market-service npx tsc --noEmit
```

**Important:** `npm run dev` (via `tsx watch`) does **not** type-check — it strips types and runs. Real `tsc` compilation only happens via `npm run build` (or `npx tsc --noEmit`). Always run type-checking before pushing; CI will catch it, but it's faster to catch locally.

## Manually Triggering Background Jobs

The FX sync job doesn't run automatically in development (see [Architecture](./ARCHITECTURE.md#environment-gated-startup-behavior)). Trigger it manually:

```bash
curl -X POST http://localhost:4001/api/v1/sync/trigger
sleep 6
curl http://localhost:4001/api/v1/sync/status
```

## Common Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find module 'X'` after `npm install X` | Stale `node_modules` volume | `docker compose down -v && docker compose build --no-cache market-service && docker compose up -d` |
| `ETIMEDOUT` on outbound HTTPS calls (npm, ExchangeRate-API) | Broken IPv6 in Docker network | Should be fixed already via `NODE_OPTIONS=--dns-result-order=ipv4first`; if it recurs elsewhere, apply the same fix |
| ESLint/tsc "file not included in tsconfig" | New top-level file/folder not in `tsconfig.json`'s `include` | Add the path to `include` in `tsconfig.json` |
| `'<' expected` / cryptic syntax errors right after pasting a generic type declaration | Terminal/paste swallowed a `<` character | Verify with `sed -n 'Np' file | od -c`, check for the missing `<`, fix with `sed -i` or a text editor |
| Tests pass individually but fail when run together | Cross-file test isolation | Confirm `fileParallelism: false` is set in `vitest.config.ts` |
| Empty `printenv VAR` output inside a container | Env var not listed in `docker-compose.yml`'s `environment:` block | Add `VAR: ${VAR}` there, then `docker compose up -d --force-recreate market-service` |

## Adding a New Resource (module)

Following the established pattern (see `src/repositories/currency.repository.ts` as a minimal example):

1. **Repository** (`src/repositories/<name>.repository.ts`) — extend `BaseRepository<typeof prisma.<model>>`, add domain-specific query methods
2. **Validator** (`src/validators/<name>.validator.ts`) — Zod schema, if the resource accepts input
3. **Controller** (`src/controllers/<name>.controller.ts`) — thin handlers, `ApiResponse`/`ApiError`
4. **Routes** (`src/routes/<name>.routes.ts`) — wire `asyncHandler` + `validate` middleware where needed
5. **Mount** in `src/routes/index.ts`
6. **Tests** — unit (if there's branching logic), integration (repository), API (full HTTP cycle)

Route ordering matters: more specific paths (`/:base/:quote/latest`) must be registered before more general ones (`/:base/:quote`), or Express will match the general pattern first.