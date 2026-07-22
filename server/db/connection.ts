import { createClient } from '@libsql/client'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

let db: any

if (tursoUrl && tursoToken) {
  db = createClient({ url: tursoUrl, authToken: tursoToken })
  console.log('✅ Using Turso cloud database')
} else {
  const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'database', 'tapsilogan.db')
  const dbDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
  const localDb = new Database(DB_PATH)
  localDb.pragma('journal_mode = WAL')
  localDb.pragma('foreign_keys = ON')
  db = localDb
  console.log('✅ Using local SQLite database')
}

export default db
