import { defineConfig } from 'drizzle-kit';
import { resolveLocalDatabaseUrl } from './src/lib/local-paths';
export default defineConfig({
  schema: './src/db/schema.ts', out: './drizzle', dialect: 'turso',
  dbCredentials: { url: resolveLocalDatabaseUrl() },
});
