import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    env: { DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://expando@localhost:5432/hw' },
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
