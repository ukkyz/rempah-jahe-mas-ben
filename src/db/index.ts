// @ts-ignore -- @libsql/client is provided by the deployment environment.
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Local SQLite file by default; set LIBSQL_URL (and LIBSQL_AUTH_TOKEN) to use Turso / remote libsql.
const url = process.env.LIBSQL_URL || "file:local.db";
const authToken = process.env.LIBSQL_AUTH_TOKEN || undefined;

const globalForDb = globalThis as typeof globalThis & {
  __masbenLibsql?: Client;
  __masbenSchemaReady?: Promise<void>;
};

export const client = globalForDb.__masbenLibsql ?? createClient({ url, authToken });
globalForDb.__masbenLibsql = client;

export const db = drizzle(client, { schema });

const DDL = [
  `PRAGMA foreign_keys = ON`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    points INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'hangat',
    emoji TEXT NOT NULL DEFAULT '🍵',
    benefits TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    subtotal INTEGER NOT NULL,
    discount INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    points_used INTEGER NOT NULL DEFAULT 0,
    pickup_type TEXT NOT NULL DEFAULT 'ambil',
    note TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    order_id INTEGER,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS point_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    points_cost INTEGER NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🎁',
    stock INTEGER NOT NULL DEFAULT 100,
    is_active INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER NOT NULL,
    reward_name TEXT NOT NULL,
    points_cost INTEGER NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aktif',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
];

/** Creates all tables if they don't exist yet (idempotent, runs once per process). */
export function ensureSchema() {
  if (!globalForDb.__masbenSchemaReady) {
    globalForDb.__masbenSchemaReady = (async () => {
      for (const stmt of DDL) await client.execute(stmt);
    })().catch((err) => {
      globalForDb.__masbenSchemaReady = undefined;
      throw err;
    });
  }
  return globalForDb.__masbenSchemaReady;
}
