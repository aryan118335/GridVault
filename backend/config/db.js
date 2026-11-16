/**
 * GridVault ESS - PostgreSQL Connection Pool
 * Provides connection pooling and resilient query execution for backend services.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root and backend .env files
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pooler URL (Supabase or fallback)
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_XGbSB43vUhTN@ep-proud-unit-be2fzf6c-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

/**
 * Execute query with automatic error handling and fallback
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.LOG_SQL === 'true') {
      const compactSql = text.replace(/\s+/g, ' ').trim();
      console.log(
        `[DB Query ${duration}ms] ${compactSql.slice(0, 140)}${compactSql.length > 140 ? '...' : ''} | params=${JSON.stringify(params || [])} | rows=${res.rowCount}`
      );
    }
    return { rows: res.rows, rowCount: res.rowCount, duration };
  } catch (err) {
    // If DB is temporarily unreachable, return empty rows with error details
    console.error(`[DB Error] Query: "${text.slice(0, 80)}..."`, err.message);
    return { rows: [], rowCount: 0, error: err.message };
  }
}

export default { pool, query };
