# Architecture

## Position in the RemitIQ Ecosystem

RemitIQ is composed of four independent services (see the [ecosystem master spec](../../README.md) for the full picture). This repository is the **Market Service**.
                User
                 │
    ┌────────────┴────────────┐
    │                         │
  Web                     Mobile
    │                         │
    └────────────┬────────────┘
                 │
            HTTPS REST APIs
     ┌───────────┴────────────┐
     │                        │

Market Service Household Service
│ │
PostgreSQL PostgreSQL


**What this service owns:**
- Exchange Rates (official + community-submitted)
- Historical Rates
- Rate Trends
- Alert Rules & Alert Events

**What this service explicitly does NOT own:**
- Users, authentication, or JWT issuance (owned by Household Service)
- Households, budgets, or remittance records
- Money movement of any kind

Every `userId` field in this service's schema (`CommunityRate.userId`, `AlertRule.userId`) is a **plain string with no foreign key** — deliberately, since services never share databases. These values are expected to eventually come from a validated JWT issued by the Household Service, not from this service's own records.

## Module Structure

Each business capability is a self-contained vertical slice: **repository → controller → routes**, with an optional **service** layer when logic spans multiple repositories.

src/
├── clients/ Prisma client singleton, ExchangeRate-API HTTP client
├── config/ env validation (Zod), app/database/logger config
├── controllers/ one file per resource, thin — delegates to repositories/services
├── jobs/ scheduled background work (FX sync)
├── middlewares/ cross-cutting Express concerns
├── repositories/ one class per Prisma model, extends BaseRepository
├── routes/ one file per resource, mounted in routes/index.ts
├── services/ logic that spans multiple repositories (e.g. rate comparison)
├── utils/ ApiError, ApiResponse, asyncHandler, metrics, logger
└── validators/ Zod schemas, one per resource that accepts input


### Why a `BaseRepository`?

`src/repositories/base.repository.ts` is a generic class providing `findById`, `findMany`, `create`, `update`, `delete`, `count` over any Prisma model delegate:

```typescript
export class CurrencyRepository extends BaseRepository<typeof prisma.currency> {
  protected readonly model = prisma.currency;
  // + currency-specific methods (findByCode, findActive)
}
```

This avoids repeating the same five CRUD methods in every repository, while still letting each repository add its own domain-specific queries (`findByCode`, `findActiveForPair`, etc.).

### Why controllers stay thin

Controllers only: validate nothing themselves (that's `validate.middleware.ts` + Zod schemas), call one or more repositories/services, and format the response via `ApiResponse`/`ApiError`. Business logic that spans multiple repositories (e.g. comparing an official rate against a community rate) lives in `services/`, not in the controller — see `rate-comparison.service.ts` as the canonical example.

### Why some modules are "fully independent" (Rate Comparison)

`src/controllers/rate-comparison.controller.ts` and `src/routes/rate-comparison.routes.ts` deliberately do **not** live inside the Exchange Rate or Community Rate modules, even though it reads from both. This was a deliberate choice: if "best rate" logic were nested inside `exchange-rate.controller.ts`, that module would silently depend on Community Rate, but not vice versa — an asymmetric coupling that makes the codebase harder to reason about and harder to split apart later if these ever became separate services. Rate Comparison is mounted at its own top-level path (`/api/v1/best-rate`) for the same reason — avoiding any route-registration-order coupling with `/api/v1/rates`.

## Data Model

Currency ──┬── ExchangeRate ──── Provider
├── CommunityRate
├── ExchangeRateHistory
└── AlertRule ──── AlertEvent


### `Currency`
ISO 4217 currencies tracked by the system (USD, EUR, GBP, AED, XAF). XAF is the primary destination currency per the product's core remittance corridors.

### `Provider`
An **automated external FX data source** (e.g. ExchangeRate-API). Strictly for API-fetched rates — never a user, never a "provider" of community data. `priority` determines preference order when multiple active providers exist (lower value = more preferred).

### `ExchangeRate`
The **current** official rate for a (base, quote, provider) triple. One row per triple — enforced by a unique constraint — upserted on every FX sync run.

### `ExchangeRateHistory`
**Append-only** snapshot of a rate at the time it was fetched. Never updated, only inserted. Powers the `/rates/:base/:quote/history` trend endpoint.

### `CommunityRate`
A **user-submitted** parallel/street-market rate observation (e.g. informal exchanges in the UAE). Deliberately modeled as a **separate table from `ExchangeRate`**, not a "provider," because:
- Many users can (and should) submit different rates for the same pair — there's no one-row-per-pair constraint.
- It carries fields `ExchangeRate` doesn't need: `userId`, `location`.
- Treating it as another `Provider` would have forced an artificial one-current-rate-per-pair constraint onto inherently multi-valued, crowd-sourced data.

### `AlertRule` / `AlertEvent`
A user-defined threshold (`condition`: `GREATER_THAN_OR_EQUAL` / `LESS_THAN_OR_EQUAL`, `threshold`: a rate value) for a currency pair. Every FX sync run checks all active rules for the pair it just updated; a met condition creates an `AlertEvent` with `status: PENDING`.

**Notification delivery is intentionally unimplemented.** `AlertEvent.status` stays `PENDING` — actually sending an email/push/SMS requires user contact info, which only the Household Service will own. This is a deliberate stopping point, not an oversight.

## Key Design Decisions

### Driver adapters (Prisma 7)

This project uses Prisma 7's `prisma-client` generator (not the older `prisma-client-js`), which requires a **driver adapter** rather than a bare connection string:

```typescript
const adapter = new PrismaPg({ connectionString: databaseConfig.url });
export const prisma = new PrismaClient({ adapter });
```

The generated client lives in `generated/prisma/` (not `node_modules/@prisma/client`) — a project-root-relative import path, not the package name.

### IPv4-forced DNS resolution

`NODE_OPTIONS=--dns-result-order=ipv4first` is set in every Docker stage that makes outbound network calls (`npm ci`, `prisma generate`) and in the running container. Some Docker network configurations have broken/unroutable IPv6 connectivity — Node's default DNS resolution order tries IPv6 first, causing `ETIMEDOUT` errors on outbound HTTPS calls (both to npm's registry during builds, and to ExchangeRate-API at runtime) even though IPv4 connectivity works fine.

### Non-root production container

The production Docker stage runs as the built-in `node` user (uid 1000), not `root`. `WORKDIR` ownership is handed to `node` before switching users (cheap, since the directory is still empty at that point), and every `COPY` uses `--chown=node:node` — avoiding a slow recursive `chown -R` over a populated `node_modules` tree.

### Environment-gated startup behavior

The FX sync scheduler runs once immediately on startup **except in development** (`NODE_ENV=development`), since the dev workflow uses `tsx watch`, which restarts the process on every file save — an unconditional startup run would spam the real external API on every edit.

## Testing Strategy

Three layers, matching `tests/unit/`, `tests/integration/`, `tests/api/`:

- **Unit** — pure logic, all dependencies mocked via `vi.mock`. No database, no HTTP. Example: `rate-comparison.service.test.ts` tests every branch of `findBestRate` without touching Prisma.
- **Integration** — real repository against a real (but isolated) test database (`market_db_test`), truncated before each test via `tests/helpers/db.ts`. Catches real SQL-level bugs mocks can't (unique constraint violations, actual query behavior).
- **API** — full HTTP request/response cycle via `supertest`, against the real Express `app` instance. The automated equivalent of manual `curl` testing.

Test files run **sequentially, not in parallel** (`fileParallelism: false` in `vitest.config.ts`), because all files share one physical test database and each resets it via truncation in `beforeEach` — running in parallel caused one file's reset to wipe data another file was actively using mid-test.

See [Development Guide](./DEVELOPMENT.md) for how to run tests locally.