import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { EFFECTIVE_DB_URL, EFFECTIVE_AUTH_TOKEN } from '@/lib/env';

const client = createClient({
  url: EFFECTIVE_DB_URL,
  ...(EFFECTIVE_AUTH_TOKEN ? { authToken: EFFECTIVE_AUTH_TOKEN } : {}),
});

export const db = drizzle(client, { schema });
