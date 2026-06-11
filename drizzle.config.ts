import { defineConfig } from 'drizzle-kit';

const dbUrl = process.env.DATABASE_URL ?? 'file:tnpa-investment.db';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: dbUrl,
  },
});
