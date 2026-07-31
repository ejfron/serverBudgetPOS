// check-null-branch.js
// Usage: node check-null-branch.js
// Adjust DB_PATH below if your database file lives somewhere else.

import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'database', 'tapsilogan.db')

console.log(`Opening database at: ${DB_PATH}\n`)

const db = new DatabaseSync(DB_PATH)

const rows = db.prepare(`
  SELECT id, name, branch_id
  FROM menu_items
  WHERE branch_id IS NULL
`).all()

if (rows.length === 0) {
  console.log('✅ No menu_items with NULL branch_id. Nothing to clean up.')
} else {
  console.log(`⚠️  Found ${rows.length} menu_items with NULL branch_id:\n`)
  console.table(rows)
  console.log('\nTo delete these, run: node delete-null-branch.js')
  console.log('Or to assign them to a specific branch, run a manual UPDATE (see chat).')
}

db.close()