import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

export default db


// import Database from 'better-sqlite3'
// import path from 'node:path'
// import fs from 'node:fs'

// const DB_PATH = process.env.DB_PATH
//   || path.join(process.cwd(), 'database', 'tapsilogan.db')

// const dbDir = path.dirname(DB_PATH)
// if (!fs.existsSync(dbDir)) {
//   fs.mkdirSync(dbDir, { recursive: true })
// }

// const db = new Database(DB_PATH)

// db.pragma('journal_mode = WAL')
// db.pragma('foreign_keys = ON')

// export default db