import { defineConfig } from 'drizzle-kit';

const url =
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'file:tnpa-investment.db';

const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url,
    ...(authToken ? { authToken } : {}),
  },
});
