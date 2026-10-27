/**
 * GridVault ESS - Neon PostgreSQL Connection Pool
 * Provides connection pooling and resilient query execution for backend services.
 */
import pg from 'pg';

const { Pool } = pg;

// Neon PostgreSQL connection pooler URL
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_XGbSB43vUhTN@ep-proud-unit-be2fzf6c-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Execute query with automatic error handling and fallback
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return { rows: res.rows, rowCount: res.rowCount, duration };
  } catch (err) {
    // If DB is temporarily unreachable, return empty rows with error details
    console.error(`[DB Error] Query: "${text.slice(0, 80)}..."`, err.message);
    return { rows: [], rowCount: 0, error: err.message };
  }
}

export default { pool, query };
