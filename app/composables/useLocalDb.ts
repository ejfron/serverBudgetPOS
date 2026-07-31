import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'

let sqlite: SQLiteConnection | null = null
let db: SQLiteDBConnection | null = null

export function useLocalDb() {
 async function init() {
    if (db) return db
    sqlite = new SQLiteConnection(CapacitorSQLite)
    db = await sqlite.createConnection('tapsilogan_local', false, 'no-encryption', 1, false)
    await db.open()

    await db.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        business_type TEXT,
        admin_branch_id TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        business_type TEXT,
        branch_id TEXT,
        branch_name TEXT,
        full_name TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        wholesale_price REAL,
        image_url TEXT,
        branch_id TEXT,
        is_available INTEGER DEFAULT 1,
        stock_status TEXT DEFAULT 'available'
      );

      CREATE TABLE IF NOT EXISTS menu_item_sizes (
        id TEXT PRIMARY KEY,
        menu_item_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        wholesale_price REAL,
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        branch_id TEXT,
        order_number INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        total_amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        order_type TEXT DEFAULT 'dine-in',
        notes_type TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        price_type TEXT DEFAULT 'regular',
        size_name TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
    `)

    const safeAlter = async (sql: string) => {
      try { await db!.execute(sql) } catch { }
    }
    await safeAlter(`ALTER TABLE order_items ADD COLUMN price_type TEXT DEFAULT 'regular'`)
    await safeAlter(`ALTER TABLE order_items ADD COLUMN size_name TEXT`)
    await safeAlter(`ALTER TABLE orders ADD COLUMN branch_id TEXT`)
    await safeAlter(`ALTER TABLE menu_items ADD COLUMN is_available INTEGER DEFAULT 1`)
    await safeAlter(`ALTER TABLE menu_items ADD COLUMN stock_status TEXT DEFAULT 'available'`)

    return db
  }

  async function query(sql: string, params: any[] = []) {
    const conn = await init()
    const result = await conn.query(sql, params)
    return result.values ?? []
  }

  async function run(sql: string, params: any[] = []) {
    const conn = await init()
    return conn.run(sql, params)
  }

  async function hashPassword(password: string): Promise<string> {
    const enc = new TextEncoder().encode(password)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  return { init, query, run, hashPassword }
}

