import { createClient } from '@libsql/client/sqlite3';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { EFFECTIVE_DB_URL } from '@/lib/env';
import { requireInitializedDatabase } from '@/lib/local-paths';
requireInitializedDatabase();
export const client = createClient({ url: EFFECTIVE_DB_URL });
export const db = drizzle(client, { schema });
