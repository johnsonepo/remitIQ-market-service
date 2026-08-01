import { execSync } from 'node:child_process';
import { beforeAll } from 'vitest';

/**
 * Ensures the test database schema is up to date before any tests
 * run. Uses `prisma migrate deploy` (not `migrate dev`) since this
 * should apply existing migrations without prompting or generating
 * new ones — appropriate for a non-interactive test run.
 *
 * DATABASE_URL is overridden to point at the dedicated test database
 * (see DATABASE_URL_TEST in .env) so tests never touch dev data.
 */
beforeAll(() => {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  });
});