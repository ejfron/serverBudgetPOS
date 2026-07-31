import db from './connection.js'

export async function runMigrations() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        business_type TEXT NOT NULL DEFAULT '',
        created_by_branch TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'front', 'kitchen')),
        branch_id TEXT NOT NULL,
        full_name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'silog',
        price REAL NOT NULL CHECK(price >= 0),
        business_type TEXT DEFAULT '',
        branch_id TEXT,
        image_url TEXT,
        is_available INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        branch_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        branch_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        order_number INTEGER NOT NULL,
        created_by TEXT NOT NULL,
        total_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        order_type TEXT NOT NULL DEFAULT 'dine-in',
        notes_type TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        ready_at TEXT,
        completed_at TEXT
      )
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        menu_item_id TEXT,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        price_type TEXT DEFAULT 'regular',
        size_name TEXT
      )
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        business_name TEXT NOT NULL DEFAULT 'BudgetPOS',
        address TEXT,
        phone TEXT,
        currency TEXT NOT NULL DEFAULT '₱',
        tax_rate REAL NOT NULL DEFAULT 0,
        receipt_header TEXT,
        receipt_footer TEXT DEFAULT 'Salamat po! Balik kayo :)',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    // ── Indexes ──────────────────────────────────────────────────────────
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_orders_branch_status ON orders(branch_id, status)`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_orders_branch_created ON orders(branch_id, created_at)`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_menu_items_branch ON menu_items(branch_id, is_available)`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id, role)`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_branches_created_by ON branches(created_by_branch)`)

    // ── Safe column additions ────────────────────────────────────────────
    const safeAlter = async (sql: string) => {
      try { await db.execute(sql) } catch { /* column already exists */ }
    }

    await safeAlter(`ALTER TABLE menu_items ADD COLUMN branch_id TEXT`)
    await safeAlter(`ALTER TABLE menu_items ADD COLUMN image_url TEXT`)
    await safeAlter(`ALTER TABLE menu_items ADD COLUMN business_type TEXT DEFAULT ''`)
    await safeAlter(`ALTER TABLE menu_items ADD COLUMN is_available INTEGER DEFAULT 1`)
    await safeAlter(`ALTER TABLE menu_items ADD COLUMN stock_status TEXT DEFAULT 'available'`)
    await safeAlter(`ALTER TABLE menu_items ADD COLUMN wholesale_price REAL`)
    await safeAlter(`ALTER TABLE branches ADD COLUMN created_by_branch TEXT`)
    await safeAlter(`ALTER TABLE branches ADD COLUMN address TEXT`)
    await safeAlter(`ALTER TABLE branches ADD COLUMN business_type TEXT NOT NULL DEFAULT 'tapsilogan'`)
    await safeAlter(`ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'`)
    await safeAlter(`ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'dine-in'`)
    await safeAlter(`ALTER TABLE orders ADD COLUMN notes_type TEXT NOT NULL DEFAULT ''`)
    await safeAlter(`ALTER TABLE order_items ADD COLUMN menu_item_id TEXT`)
    await safeAlter(`ALTER TABLE order_items ADD COLUMN price_type TEXT DEFAULT 'regular'`)
    await safeAlter(`ALTER TABLE categories ADD COLUMN branch_id TEXT`)
    await safeAlter(`ALTER TABLE categories ADD COLUMN business_type TEXT DEFAULT ''`)
    await safeAlter(`ALTER TABLE menu_items ADD COLUMN business_type TEXT NOT NULL DEFAULT 'tapsilogan'`)

    console.log('✅ Database migrations complete')

    await seedInitialSettings()
    await seedCategories()

    // Backfill created_by_branch for existing admin branches
    await db.execute(`
      UPDATE branches
      SET created_by_branch = id
      WHERE created_by_branch IS NULL
      AND id IN (SELECT branch_id FROM users WHERE role = 'admin')
    `)

    console.log('✅ Migrations + seeding complete')
  } catch (err) {
    console.error('Migration error:', err)
  }
}

async function seedInitialSettings() {
  try {
    const existing = await db.execute('SELECT id FROM settings WHERE id = 1')
    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO settings (id, business_name, receipt_footer) VALUES (1, ?, ?)`,
        args: ['BudgetPOS', 'Salamat po! Balik kayo :)'],
      })
      console.log('✅ Default settings created')
    }
  } catch (err) {
    console.error('Error seeding initial settings:', err)
  }
}

async function seedCategories() {
  const insert = async (id: string, name: string, businessType: string) => {
    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO categories (id, name, business_type) VALUES (?, ?, ?)`,
        args: [id, name, businessType],
      })
    } catch (err) {
      console.error('Seed category failed:', id, err)
    }
  }

  for (const name of ['Silog', 'Drinks', 'Extras']) {
    await insert(name.toLowerCase(), name, 'tapsilogan')
  }
  for (const name of ['Rice', 'Ulam', 'Soup', 'Drinks', 'Extras']) {
    await insert(`${name.toLowerCase()}_restaurant`, name, 'restaurant')
  }
  for (const name of ['Rice', 'Ulam', 'Drinks', 'Extras']) {
    await insert(`${name.toLowerCase()}_karinderya`, name, 'karinderya')
  }
  for (const name of ['Dry Groceries', 'Condiments', 'Beverages', 'Snacks & Chichirya', 'Personal Care & Hygiene']) {
    await insert(name.toLowerCase().replace(/[^a-z0-9]/g, '_'), name, 'sarisari')
  }
  for (const name of ['Burgers', 'Fries', 'Drinks', 'Milktea', 'Tacos', 'Extras']) {
    await insert(name.toLowerCase(), name, 'fastfood')
  }
}



// import db from './connection.js'
// import { randomUUID } from 'node:crypto'
// import bcrypt from 'bcrypt'

// export function runMigrations() {
//   try {

//     db.exec(`
//       CREATE TABLE IF NOT EXISTS branches (
//         id TEXT PRIMARY KEY,
//         name TEXT NOT NULL,
//         address TEXT,
//         business_type TEXT NOT NULL DEFAULT '',
//         created_by_branch TEXT,
//         created_at TEXT NOT NULL DEFAULT (datetime('now')),
//         FOREIGN KEY (created_by_branch) REFERENCES branches(id)
//       );

//       CREATE TABLE IF NOT EXISTS users (
//         id TEXT PRIMARY KEY,
//         username TEXT NOT NULL UNIQUE,
//         password_hash TEXT NOT NULL,
//         role TEXT NOT NULL CHECK(role IN ('admin', 'front', 'kitchen')),
//         branch_id TEXT NOT NULL,
//         full_name TEXT,
//         created_at TEXT NOT NULL DEFAULT (datetime('now')),
//         FOREIGN KEY (branch_id) REFERENCES branches(id)
//       );

//       CREATE TABLE IF NOT EXISTS menu_items (
//         id TEXT PRIMARY KEY,
//         name TEXT NOT NULL,
//         category TEXT NOT NULL DEFAULT 'silog',
//         price REAL NOT NULL CHECK(price >= 0),
//         business_type TEXT DEFAULT '',
//         branch_id TEXT,
//         image_url TEXT,
//         is_available INTEGER NOT NULL DEFAULT 1,
//         created_at TEXT NOT NULL DEFAULT (datetime('now')),
//         FOREIGN KEY (branch_id) REFERENCES branches(id)
//       );

//       CREATE TABLE IF NOT EXISTS categories (
//         id TEXT PRIMARY KEY,
//         name TEXT NOT NULL UNIQUE,
//         branch_id TEXT,
//         created_at TEXT NOT NULL DEFAULT (datetime('now'))
//       );

//       CREATE TABLE IF NOT EXISTS orders (
//         id TEXT PRIMARY KEY,
//         branch_id TEXT NOT NULL,
//         status TEXT NOT NULL DEFAULT 'pending'
//           CHECK(status IN ('pending', 'ready', 'completed')),
//         order_number INTEGER NOT NULL,
//         created_by TEXT NOT NULL,
//         total_amount REAL NOT NULL DEFAULT 0,
//         payment_method TEXT NOT NULL DEFAULT 'cash',
//         order_type TEXT NOT NULL DEFAULT 'dine-in',
//         notes_type TEXT NOT NULL DEFAULT '',
//         created_at TEXT NOT NULL DEFAULT (datetime('now')),
//         ready_at TEXT,
//         completed_at TEXT,
//         FOREIGN KEY (branch_id) REFERENCES branches(id),
//         FOREIGN KEY (created_by) REFERENCES users(id)
//       );

//       CREATE TABLE IF NOT EXISTS order_items (
//         id TEXT PRIMARY KEY,
//         order_id TEXT NOT NULL,
//         menu_item_id TEXT,
//         item_name TEXT NOT NULL,
//         quantity INTEGER NOT NULL CHECK(quantity > 0),
//         unit_price REAL NOT NULL,
//         subtotal REAL NOT NULL,
//         FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
//       );

//       CREATE TABLE IF NOT EXISTS settings (
//         id INTEGER PRIMARY KEY DEFAULT 1,
//         business_name TEXT NOT NULL DEFAULT 'BudgetPOS',
//         address TEXT,
//         phone TEXT,
//         currency TEXT NOT NULL DEFAULT '₱',
//         tax_rate REAL NOT NULL DEFAULT 0,
//         receipt_header TEXT,
//         receipt_footer TEXT DEFAULT 'Salamat po! Balik kayo :)',
//         updated_at TEXT NOT NULL DEFAULT (datetime('now'))
//       );
//     `)

//     // ── Indexes ───────────────────────────────────────────────────────────────

//     db.exec(`
//       CREATE INDEX IF NOT EXISTS idx_orders_branch_status
//         ON orders(branch_id, status);

//       CREATE INDEX IF NOT EXISTS idx_orders_branch_created
//         ON orders(branch_id, created_at);

//       CREATE INDEX IF NOT EXISTS idx_order_items_order_id
//         ON order_items(order_id);

//       CREATE INDEX IF NOT EXISTS idx_menu_items_branch
//         ON menu_items(branch_id, is_available);

//       CREATE INDEX IF NOT EXISTS idx_users_branch
//         ON users(branch_id, role);

//       CREATE INDEX IF NOT EXISTS idx_branches_created_by
//         ON branches(created_by_branch);
//     `)

//     // ── Safe column additions (for existing databases) ─────────────────────

//     const safeAlter = (sql: string) => {
//       try { db.exec(sql) } catch { /* column already exists */ }
//     }

//     safeAlter(`ALTER TABLE menu_items ADD COLUMN branch_id TEXT REFERENCES branches(id)`)
//     safeAlter(`ALTER TABLE menu_items ADD COLUMN image_url TEXT`)
//     safeAlter(`ALTER TABLE menu_items ADD COLUMN business_type TEXT DEFAULT ''`)
//     safeAlter(`ALTER TABLE menu_items ADD COLUMN is_available INTEGER DEFAULT 1`)
//     safeAlter(`ALTER TABLE menu_items ADD COLUMN stock_status TEXT DEFAULT 'available'`)
//     safeAlter(`ALTER TABLE menu_items ADD COLUMN wholesale_price REAL`)
//     safeAlter(`ALTER TABLE branches ADD COLUMN created_by_branch TEXT REFERENCES branches(id)`)
//     safeAlter(`ALTER TABLE branches ADD COLUMN address TEXT`)
//     safeAlter(`ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'`)
//     safeAlter(`ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'dine-in'`)
//     safeAlter(`ALTER TABLE orders ADD COLUMN notes_type TEXT NOT NULL DEFAULT ''`)
//     safeAlter(`ALTER TABLE order_items ADD COLUMN menu_item_id TEXT`)
//     safeAlter(`ALTER TABLE order_items ADD COLUMN price_type TEXT DEFAULT 'regular'`)
//     safeAlter(`ALTER TABLE categories ADD COLUMN branch_id TEXT`)
//     safeAlter(`ALTER TABLE categories ADD COLUMN business_type TEXT DEFAULT ''`)
    


//     // ── Clean up duplicate 'notes' column if it exists ───────────────────
//     const orderInfo = db.prepare(`
//       SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'
//     `).get() as { sql: string } | undefined

//     // Check if duplicate 'notes' column exists alongside 'notes_type'
//     if (orderInfo?.sql.includes('notes TEXT') && orderInfo?.sql.includes('notes_type TEXT')) {
//       console.log('⚠️ Found duplicate notes/notes_type columns. Cleaning up...')
      
//       // Migrate any data from notes to notes_type
//       try {
//         db.exec(`
//           UPDATE orders 
//           SET notes_type = notes 
//           WHERE (notes_type IS NULL OR notes_type = '') 
//           AND notes IS NOT NULL 
//           AND notes != ''
//         `)
//         console.log('✅ Migrated data from notes to notes_type')
//       } catch (err) {
//         console.error('Failed to migrate notes data:', err)
//       }

//       // Recreate table without notes column
//       db.exec('PRAGMA foreign_keys = OFF')
//       try {
//         db.exec(`
//           BEGIN TRANSACTION;
          
//           CREATE TABLE orders_new (
//             id TEXT PRIMARY KEY,
//             branch_id TEXT NOT NULL REFERENCES branches(id),
//             status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'ongoing', 'ready', 'completed', 'voided')),
//             order_number INTEGER NOT NULL,
//             created_by TEXT NOT NULL REFERENCES users(id),
//             total_amount REAL NOT NULL DEFAULT 0,
//             payment_method TEXT NOT NULL DEFAULT 'cash',
//             order_type TEXT NOT NULL DEFAULT 'dine-in',
//             notes_type TEXT NOT NULL DEFAULT '',
//             created_at TEXT NOT NULL DEFAULT (datetime('now')),
//             ready_at TEXT,
//             completed_at TEXT
//           );
          
//           INSERT INTO orders_new 
//           SELECT id, branch_id, status, order_number, created_by, total_amount, 
//                  payment_method, order_type, notes_type, created_at, ready_at, completed_at
//           FROM orders;
          
//           DROP TABLE orders;
//           ALTER TABLE orders_new RENAME TO orders;
          
//           CREATE INDEX IF NOT EXISTS idx_orders_branch_status ON orders(branch_id, status);
//           CREATE INDEX IF NOT EXISTS idx_orders_branch_created ON orders(branch_id, created_at);
          
//           COMMIT;
//         `)
//         console.log('✅ Removed duplicate notes column')
//       } catch (err) {
//         db.exec('ROLLBACK')
//         console.error('Failed to remove duplicate notes column:', err)
//       }
//       db.exec('PRAGMA foreign_keys = ON')
//     }

//     console.log('✅ Database migrations complete')
//     seedInitialSettings()

//     const seedCategories = db.prepare(
//       'INSERT OR IGNORE INTO categories (id, name, business_type) VALUES (?, ?, ?)'
//     )

//     for (const name of ['Silog', 'Drinks', 'Extras']) {
//       seedCategories.run(name.toLowerCase(), name, 'tapsilogan')
//     }
//     for (const name of ['Rice', 'Ulam', 'Soup', 'Drinks', 'Extras']) {
//       seedCategories.run(`${name.toLowerCase()}_restaurant`, name, 'restaurant')
//     }
//     for (const name of ['Rice', 'Ulam', 'Drinks', 'Extras']) {
//       seedCategories.run(`${name.toLowerCase()}_karinderya`, name, 'karinderya')
//     }
//     for (const name of ['Dry Groceries', 'Condiments', 'Beverages', 'Snacks & Chichirya', 'Personal Care & Hygiene']) {
//       seedCategories.run(name.toLowerCase().replace(/[^a-z0-9]/g, '_'), name, 'sarisari')
//     }
//     for (const name of ['Burgers', 'Fries', 'Drinks', 'Milktea', 'Tacos', 'Extras']) {
//       seedCategories.run(name.toLowerCase(), name, 'fastfood')
//     }

//     // ── menu_items migrations ──────────────────────────────────────────
//     const menuItemsInfo = db.prepare(`
//       SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'menu_items'
//     `).get() as { sql: string } | undefined

//     const hasMenuItemsBusinessType = menuItemsInfo?.sql.includes('business_type')
//     if (!hasMenuItemsBusinessType) {
//       try {
//         db.exec(`ALTER TABLE menu_items ADD COLUMN business_type TEXT NOT NULL DEFAULT 'tapsilogan'`)
//         console.log('✅ business_type column added to menu_items')
//       } catch (err) { console.error("Migration step failed:", err) }
//     }

//     const hasMenuItemsBranchId = menuItemsInfo?.sql.includes('branch_id')
//     if (!hasMenuItemsBranchId) {
//       try {
//         db.exec(`ALTER TABLE menu_items ADD COLUMN branch_id TEXT`)
//         console.log('✅ branch_id column added to menu_items')
//       } catch (err) { console.error("Migration step failed:", err) }
//     }

//     const hasOldCategoryConstraint = menuItemsInfo?.sql.includes("CHECK(category IN ('silog', 'drinks', 'extras'))")
//     if (hasOldCategoryConstraint) {
//       db.exec('PRAGMA foreign_keys = OFF')
//       db.exec(`
//         BEGIN TRANSACTION;
//         CREATE TABLE menu_items_new (
//           id TEXT PRIMARY KEY,
//           name TEXT NOT NULL,
//           category TEXT NOT NULL,
//           price REAL NOT NULL CHECK(price >= 0),
//           image_url TEXT,
//           is_available INTEGER NOT NULL DEFAULT 1,
//           created_at TEXT NOT NULL DEFAULT (datetime('now'))
//         );
//         INSERT INTO menu_items_new (id, name, category, price, is_available, created_at)
//         SELECT id, name, category, price, is_available, created_at FROM menu_items;
//         DROP TABLE menu_items;
//         ALTER TABLE menu_items_new RENAME TO menu_items;
//         COMMIT;
//       `)
//       db.exec('PRAGMA foreign_keys = ON')
//       console.log('✅ menu_items category constraint removed')
//     } else {
//       const hasImageUrl = menuItemsInfo?.sql.includes('image_url')
//       if (!hasImageUrl) {
//         try {
//           db.exec(`ALTER TABLE menu_items ADD COLUMN image_url TEXT`)
//         } catch (err) { console.error("Migration step failed:", err) }
//       }
//     }

//     // ── branches migrations ────────────────────────────────────────────
//     const branchInfo = db.prepare(`
//       SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'branches'
//     `).get() as { sql: string } | undefined

//     const hasBusinessType = branchInfo?.sql.includes('business_type')
//     if (!hasBusinessType) {
//       try {
//         db.exec(`ALTER TABLE branches ADD COLUMN business_type TEXT NOT NULL DEFAULT 'tapsilogan'`)
//         console.log('✅ business_type column added to branches')
//       } catch (err) { console.error("Migration step failed:", err) }
//     }

//     const hasCreatedByBranch = branchInfo?.sql.includes('created_by_branch')
//     if (!hasCreatedByBranch) {
//       try {
//         db.exec(`ALTER TABLE branches ADD COLUMN created_by_branch TEXT`)
//         console.log('✅ created_by_branch column added to branches')
//       } catch (err) { console.error("Migration step failed:", err) }
//     }

//     db.exec(`
//       UPDATE branches
//       SET created_by_branch = id
//       WHERE created_by_branch IS NULL
//       AND id IN (SELECT branch_id FROM users WHERE role = 'admin')
//     `)
  


//     // ── orders migrations ──────────────────────────────────────────────
//     const hasPaymentMethod = orderInfo?.sql.includes('payment_method')
//     if (!hasPaymentMethod) {
//       try {
//         db.exec(`ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'`)
//         console.log('✅ payment_method column added to orders')
//       } catch (err) { console.error("Migration step failed:", err) }
//     }

//     const hasOrderType = orderInfo?.sql.includes('order_type')
//     if (!hasOrderType) {
//       try {
//         db.exec(`ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'dine-in'`)
//         console.log('✅ order_type column added to orders')
//       } catch (err) { console.error("Migration step failed:", err) }
//     }

//     const hasNotesType = orderInfo?.sql.includes('notes_type')
//     if (!hasNotesType) {
//       try {
//         db.exec(`ALTER TABLE orders ADD COLUMN notes_type TEXT NOT NULL DEFAULT ''`)
//         console.log('✅ notes_type column added to orders')
//       } catch (err) { console.error("Migration step failed:", err) }
//     }

//     const hasOldStatusCheck = orderInfo?.sql.includes("CHECK(status IN ('pending', 'ready', 'completed'))")
//     if (hasOldStatusCheck) {
//       db.exec('PRAGMA foreign_keys = OFF')
//       db.exec(`
//         BEGIN TRANSACTION;
//         CREATE TABLE orders_new (
//           id TEXT PRIMARY KEY,
//           branch_id TEXT NOT NULL REFERENCES branches(id),
//           status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'ongoing', 'ready', 'completed', 'voided')),
//           order_number INTEGER NOT NULL,
//           created_by TEXT NOT NULL REFERENCES users(id),
//           total_amount REAL NOT NULL DEFAULT 0,
//           payment_method TEXT NOT NULL DEFAULT 'cash',
//           order_type TEXT NOT NULL DEFAULT 'dine-in',
//           notes_type TEXT NOT NULL DEFAULT '',
//           created_at TEXT NOT NULL DEFAULT (datetime('now')),
//           ready_at TEXT,
//           completed_at TEXT
//         );
//         INSERT INTO orders_new (id, branch_id, status, order_number, created_by, total_amount, payment_method, order_type, notes_type, created_at, ready_at, completed_at)
//         SELECT id, branch_id, status, order_number, created_by, total_amount,
//                COALESCE(payment_method, 'cash'),
//                COALESCE(order_type, 'dine-in'),
//                COALESCE(notes_type, ''),
//                created_at, ready_at, completed_at
//         FROM orders;
//         DROP TABLE orders;
//         ALTER TABLE orders_new RENAME TO orders;
//         CREATE INDEX IF NOT EXISTS idx_orders_branch_status ON orders(branch_id, status);
//         COMMIT;
//       `)
//       db.exec('PRAGMA foreign_keys = ON')
//       console.log('✅ orders status constraint updated (added ongoing, voided) — order_type & notes preserved')
//     }

//     console.log('✅ Database migrations complete')
//   } catch (err) {
//     console.error('Migration error:', err)
//   }
// }

// function seedInitialSettings() {
//   try {
//     const existing = db.prepare('SELECT id FROM settings WHERE id = 1').get()
//     if (!existing) {
//       db.prepare(`
//         INSERT INTO settings (id, business_name, receipt_footer)
//         VALUES (1, 'BudgetPOS', 'Salamat po! Balik kayo :)')
//       `).run()
//       console.log('✅ Default settings created')
//     }
//   } catch {
//     console.error('Error seeding initial settings')
//   }
// }