import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import db from './connection.js'

export function runMigrations() {
  try {
    const isTurso = typeof db.execute === 'function'

    if (isTurso) {
      // Turso - uses execute() for each statement
      const run = (sql: string, args?: any[]) => {
        if (args) {
          db.execute({ sql, args })
        } else {
          db.execute(sql)
        }
      }

      run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, business_name TEXT NOT NULL DEFAULT 'My Business', address TEXT DEFAULT '', phone TEXT DEFAULT '', currency TEXT DEFAULT '₱', tax_rate REAL DEFAULT 0, updated_at TEXT DEFAULT (datetime('now')))`)
      
      run(`CREATE TABLE IF NOT EXISTS branches (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, business_type TEXT NOT NULL DEFAULT 'tapsilogan', created_by_branch TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`)
      
      run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin', 'front', 'kitchen')), branch_id TEXT NOT NULL REFERENCES branches(id), full_name TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`)
      
      run(`CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price REAL NOT NULL CHECK(price >= 0), image_url TEXT, is_available INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')))`)
      
      run(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, branch_id TEXT NOT NULL REFERENCES branches(id), status TEXT NOT NULL DEFAULT 'pending', order_number INTEGER NOT NULL, created_by TEXT NOT NULL REFERENCES users(id), total_amount REAL NOT NULL DEFAULT 0, payment_method TEXT NOT NULL DEFAULT 'cash', created_at TEXT NOT NULL DEFAULT (datetime('now')), ready_at TEXT, completed_at TEXT)`)
      
      run(`CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, menu_item_id TEXT NOT NULL REFERENCES menu_items(id), item_name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0), unit_price REAL NOT NULL, subtotal REAL NOT NULL)`)
      
      run(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, business_type TEXT NOT NULL DEFAULT 'tapsilogan', created_at TEXT DEFAULT (datetime('now')), UNIQUE(name, business_type))`)
      
      // Seed categories
      const cats = [
        ['silog','Silog','tapsilogan'],['drinks','Drinks','tapsilogan'],['extras','Extras','tapsilogan'],
        ['rice_restaurant','Rice','restaurant'],['ulam_restaurant','Ulam','restaurant'],['soup_restaurant','Soup','restaurant'],['drinks_restaurant','Drinks','restaurant'],['extras_restaurant','Extras','restaurant'],
        ['rice_karinderya','Rice','karinderya'],['ulam_karinderya','Ulam','karinderya'],['drinks_karinderya','Drinks','karinderya'],['extras_karinderya','Extras','karinderya'],
        ['dry_groceries','Dry Groceries','sarisari'],['condiments','Condiments','sarisari'],['beverages','Beverages','sarisari'],['snacks___chichirya','Snacks & Chichirya','sarisari'],['personal_care___hygiene','Personal Care & Hygiene','sarisari'],
        ['burgers','Burgers','fastfood'],['fries','Fries','fastfood'],['drinks_fastfood','Drinks','fastfood'],['milktea','Milktea','fastfood'],['tacos','Tacos','fastfood'],['extras_fastfood','Extras','fastfood']
      ]
      for (const [id, name, bt] of cats) {
        run('INSERT OR IGNORE INTO categories (id, name, business_type) VALUES (?, ?, ?)', [id, name, bt])
      }
      
      run('INSERT OR IGNORE INTO settings (id, business_name) VALUES (?, ?)', [1, 'My Business'])
      
    } else {
      // Local SQLite - use existing code
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), business_name TEXT NOT NULL DEFAULT 'My Business', address TEXT DEFAULT '', phone TEXT DEFAULT '', currency TEXT DEFAULT '₱', tax_rate REAL DEFAULT 0, updated_at TEXT DEFAULT (datetime('now')));
        CREATE TABLE IF NOT EXISTS branches (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
        CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin', 'front', 'kitchen')), branch_id TEXT NOT NULL REFERENCES branches(id), full_name TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
        CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('silog', 'drinks', 'extras')), price REAL NOT NULL CHECK(price >= 0), is_available INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')));
        CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, branch_id TEXT NOT NULL REFERENCES branches(id), status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'ready', 'completed')), order_number INTEGER NOT NULL, created_by TEXT NOT NULL REFERENCES users(id), total_amount REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), ready_at TEXT, completed_at TEXT);
        CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, menu_item_id TEXT NOT NULL REFERENCES menu_items(id), item_name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0), unit_price REAL NOT NULL, subtotal REAL NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_orders_branch_status ON orders(branch_id, status);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        INSERT OR IGNORE INTO settings (id, business_name) VALUES (1, 'My Business');
      `)

      db.exec(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, business_type TEXT NOT NULL DEFAULT 'tapsilogan', created_at TEXT DEFAULT (datetime('now')), UNIQUE(name, business_type));`)
      
      const seedCategories = db.prepare('INSERT OR IGNORE INTO categories (id, name, business_type) VALUES (?, ?, ?)')
      for (const name of ['Silog', 'Drinks', 'Extras']) { seedCategories.run(name.toLowerCase(), name, 'tapsilogan') }
      for (const name of ['Rice', 'Ulam', 'Soup', 'Drinks', 'Extras']) { seedCategories.run(`${name.toLowerCase()}_restaurant`, name, 'restaurant') }
      for (const name of ['Rice', 'Ulam', 'Drinks', 'Extras']) { seedCategories.run(`${name.toLowerCase()}_karinderya`, name, 'karinderya') }
      for (const name of ['Dry Groceries', 'Condiments', 'Beverages', 'Snacks & Chichirya', 'Personal Care & Hygiene']) { seedCategories.run(name.toLowerCase().replace(/[^a-z0-9]/g, '_'), name, 'sarisari') }
      for (const name of ['Burgers', 'Fries', 'Drinks', 'Milktea', 'Tacos', 'Extras']) { seedCategories.run(name.toLowerCase(), name, 'fastfood') }

      // Rest of local migrations...
    }

    console.log('✅ Database migrations complete')
  } catch (err) {
    console.error('Migration error:', err)
  }
}
