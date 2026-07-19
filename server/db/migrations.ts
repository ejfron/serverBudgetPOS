import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import db from './connection.js'

export function runMigrations() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        business_name TEXT NOT NULL DEFAULT 'My Business',
        address TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        currency TEXT DEFAULT '₱',
        tax_rate REAL DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'front', 'kitchen')),
        branch_id TEXT NOT NULL REFERENCES branches(id),
        full_name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('silog', 'drinks', 'extras')),
        price REAL NOT NULL CHECK(price >= 0),
        is_available INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        branch_id TEXT NOT NULL REFERENCES branches(id),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'ready', 'completed')),
        order_number INTEGER NOT NULL,
        created_by TEXT NOT NULL REFERENCES users(id),
        total_amount REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        ready_at TEXT,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_orders_branch_status ON orders(branch_id, status);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

      -- Insert default settings row if not exists
      INSERT OR IGNORE INTO settings (id, business_name) VALUES (1, 'My Business');
    `)

    // ── Custom categories table ──────────────────────────────────────
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `)
    const seedCategories = db.prepare('INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)')
    for (const name of ['Silog', 'Drinks', 'Extras']) {
      seedCategories.run(name.toLowerCase(), name)
    }

    // ── Remove the CHECK constraint on menu_items.category ───────────
    const menuItemsInfo = db.prepare(`
      SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'menu_items'
    `).get() as { sql: string } | undefined

    const hasOldCategoryConstraint = menuItemsInfo?.sql.includes("CHECK(category IN ('silog', 'drinks', 'extras'))")

    if (hasOldCategoryConstraint) {
      db.pragma('foreign_keys = OFF')

      db.exec(`
        BEGIN TRANSACTION;

        CREATE TABLE menu_items_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price REAL NOT NULL CHECK(price >= 0),
          image_url TEXT,
          is_available INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        INSERT INTO menu_items_new (id, name, category, price, is_available, created_at)
        SELECT id, name, category, price, is_available, created_at FROM menu_items;

        DROP TABLE menu_items;
        ALTER TABLE menu_items_new RENAME TO menu_items;

        COMMIT;
      `)

      db.pragma('foreign_keys = ON')

      console.log('✅ menu_items category constraint removed, custom categories now allowed')
    } else {
      try {
        db.exec(`ALTER TABLE menu_items ADD COLUMN image_url TEXT`)
      } catch {
        // column already exists — safe to ignore
      }
    }

    // ── business_type support (tapsilogan | restaurant | karinderya | sarisari) ──
    const branchInfo = db.prepare(`
      SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'branches'
    `).get() as { sql: string } | undefined

    const hasBusinessType = branchInfo?.sql.includes('business_type')

    if (!hasBusinessType) {
      try {
        db.exec(`ALTER TABLE branches ADD COLUMN business_type TEXT NOT NULL DEFAULT 'tapsilogan'`)
        console.log('✅ business_type column added to branches')
      } catch {
        // already exists — safe to ignore
      }
    }

    console.log('✅ Database migrations complete')
  } catch (err) {
    console.error('Migration error:', err)
  }
}