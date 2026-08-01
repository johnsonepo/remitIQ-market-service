/**
 * Runs before each test file. Overrides DATABASE_URL to point at the
 * dedicated test database (see DATABASE_URL_TEST in .env), so any
 * module that reads process.env.DATABASE_URL at import time
 * (e.g. the Prisma client singleton) uses the test database.
 *
 * Migration application itself happens once in global-setup.ts, not
 * here, to avoid concurrent migrate deploy calls across parallel
 * test file workers.
 */
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;