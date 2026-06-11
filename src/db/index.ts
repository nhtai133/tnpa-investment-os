import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { DATABASE_URL } from '@/lib/env';

const client = createClient({ url: DATABASE_URL });

export const db = drizzle(client, { schema });
