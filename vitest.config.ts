import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Each test run gets a fresh SQLite built from db/schema.sql + db/seed.sql.
    env: { SQLITE_PATH: ':memory:' },
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
