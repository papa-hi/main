import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("WARNING: Database URL not set. Configure SUPABASE_DATABASE_URL or DATABASE_URL.");
}

// Drizzle ORM client for queries - lazy initialization
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (!_client && databaseUrl) {
    _client = postgres(databaseUrl, {
      prepare: false,
      ssl: 'require',
    });
  }
  return _client;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    if (!_db && databaseUrl) {
      const client = getClient();
      if (client) {
        _db = drizzle(client, { schema });
      }
    }
    if (!_db) {
      throw new Error("Database not initialized. Check SUPABASE_DATABASE_URL or DATABASE_URL.");
    }
    return (_db as any)[prop];
  }
});

// pg Pool for session store (connect-pg-simple requires pg.Pool)
export const pool = databaseUrl ? new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
}) : null as any;
