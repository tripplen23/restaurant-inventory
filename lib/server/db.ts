import { createClient, type Client, type InValue } from '@libsql/client';
import * as path from 'path';
import * as fs from 'fs';
import { seedIfEmpty } from './seed';

// ─────────────────────────────────────────────────────────────────────────────
// Database adapter: Turso (prod) OR libSQL embedded file (dev / fallback)
//
// Connection priority:
//   1. TURSO_DATABASE_URL + TURSO_AUTH_TOKEN  → connect to Turso cloud
//   2. None of the above                      → embedded file at .data/inventory.db
//
// All queries go through `db.execute({ sql, args })` which is async — works
// for both backends. The rest of the codebase never touches better-sqlite3.
// ─────────────────────────────────────────────────────────────────────────────

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const DB_DIR = path.join(process.cwd(), '.data');
const LOCAL_FILE = path.join(DB_DIR, 'inventory.db');

// Ensure local file directory exists (only used in fallback mode)
if (!TURSO_URL && !fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const url = TURSO_URL ?? `file:${LOCAL_FILE}`;

declare global {
  // eslint-disable-next-line no-var
  var __db: Client | undefined;
  // eslint-disable-next-line no-var
  var __dbReady: Promise<void> | undefined;
}

function createDb(): Client {
  return createClient({
    url,
    authToken: TURSO_TOKEN,
  });
}

/**
 * Returns the singleton libSQL/Turso client.
 * Auto-runs schema migration + seed on first use.
 */
export async function getDb(): Promise<Client> {
  if (!global.__db) {
    global.__db = createDb();
  }
  if (!global.__dbReady) {
    global.__dbReady = initSchema(global.__db).then(() => seedIfEmpty(global.__db!));
  }
  await global.__dbReady;
  return global.__db;
}

async function initSchema(client: Client): Promise<void> {
  const schemaPath = path.join(process.cwd(), 'lib', 'server', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  // Split on `;` followed by newline (naive but works for our schema).
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // Skip "already exists" / "no such table" noise during view re-creates.
      if (!/already exists|no such table/i.test(msg)) {
        if (!/view/i.test(msg)) throw e;
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers — mirror the better-sqlite3 API shape we used to have
// so existing call sites read naturally:
//
//   const rows = await dbAll<Product>('SELECT * FROM products WHERE id = ?', [id]);
//   const row  = await dbFirst<Product>('SELECT * FROM products WHERE id = ?', [id]);
//   const { rowsAffected } = await dbRun('DELETE FROM products WHERE id = ?', [id]);
// ─────────────────────────────────────────────────────────────────────────────

export type Row = Record<string, unknown>;

export async function dbAll<T = Row>(
  sql: string,
  args: InValue[] = []
): Promise<T[]> {
  const client = await getDb();
  const r = await client.execute({ sql, args });
  return r.rows as unknown as T[];
}

export async function dbFirst<T = Row>(
  sql: string,
  args: InValue[] = []
): Promise<T | undefined> {
  const rows = await dbAll<T>(sql, args);
  return rows[0];
}

export async function dbRun(
  sql: string,
  args: InValue[] = []
): Promise<{ rowsAffected: number }> {
  const client = await getDb();
  const r = await client.execute({ sql, args });
  return { rowsAffected: Number(r.rowsAffected ?? 0) };
}

// Runtime info (useful for /api/health and debugging)
export const dbInfo = {
  mode: TURSO_URL ? 'turso' : 'local-file',
  url: TURSO_URL ? TURSO_URL.replace(/\/\/.*@/, '//***@') : `file:${LOCAL_FILE}`,
};
