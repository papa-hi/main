import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

// Prefer SUPABASE_DATABASE_URL if set, fall back to DATABASE_URL
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("WARNING: Database URL not set. Configure SUPABASE_DATABASE_URL or DATABASE_URL.");
}

// Detect if SSL is required based on the database URL (Supabase requires SSL)
const requiresSSL = databaseUrl?.includes('supabase.com') || databaseUrl?.includes('pooler.supabase.com');
console.log(`Database: ${requiresSSL ? 'Supabase (SSL)' : 'Local'}, ENV: ${isProduction ? 'production' : 'development'}`);
console.log('SUPABASE_DATABASE_URL set:', !!process.env.SUPABASE_DATABASE_URL);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('databaseUrl host:', databaseUrl?.match(/@([^:]+)/)?.[1]);

// Drizzle ORM client for queries - lazy initialization
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (!_client && databaseUrl) {
    _client = postgres(databaseUrl, {
      prepare: false,
      ssl: requiresSSL ? 'require' : false,
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
// For Supabase pooler, we need proper SSL config
const sessionDatabaseUrl = process.env.SUPABASE_SESSION_URL || databaseUrl;
console.log('Session URL set:', !!process.env.SUPABASE_SESSION_URL);
console.log('Session port:', sessionDatabaseUrl?.match(/:(\d+)\//)?.[1]);
console.log('sessionDatabaseUrl host:', sessionDatabaseUrl?.match(/@([^:]+)/)?.[1]);

export const pool = sessionDatabaseUrl ? new pg.Pool({
  connectionString: sessionDatabaseUrl,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
  ...({ family: 4 } as any),
}) : null as any;
