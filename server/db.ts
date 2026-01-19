import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

// Use Replit's DATABASE_URL in development, SUPABASE_DATABASE_URL in production
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = isProduction 
  ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
  : (process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL);

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
      ssl: isProduction ? 'require' : false,
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
  ssl: isProduction ? { rejectUnauthorized: false } : false,
}) : null as any;
