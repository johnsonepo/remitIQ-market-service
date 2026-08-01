import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    testTimeout: 15_000,
    // Test files share one physical test database; resetTestDatabase()
    // truncates all tables in beforeEach, so running files in parallel
    // causes one file's reset to wipe data another file is actively
    // using. Force sequential file execution to avoid cross-file races.
    fileParallelism: false,
  },
});