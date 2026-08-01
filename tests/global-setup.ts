import { execSync } from 'node:child_process';

/**
 * Runs once for the entire test run (not per test file/worker),
 * unlike setupFiles. Applies pending migrations to the test database
 * a single time, avoiding concurrent 'prisma migrate deploy' calls
 * from multiple test file workers locking against each other.
 */
export default function globalSetup(): void {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  });
}