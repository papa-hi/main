import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Database URL must be set. Configure SUPABASE_DATABASE_URL or DATABASE_URL.",
  );
}

// Drizzle ORM client for queries
const client = postgres(databaseUrl, {
  prepare: false,
});

export const db = drizzle(client, { schema });

// pg Pool for session store (connect-pg-simple requires pg.Pool)
export const pool = new pg.Pool({
  connectionString: databaseUrl,
});
