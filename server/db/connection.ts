import { createClient, type Client } from '@libsql/client'

let _client: Client | null = null

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
  }
  return _client
}

const db = {
  execute: (...args: Parameters<Client['execute']>) => getClient().execute(...args),
  transaction: (...args: Parameters<Client['transaction']>) => getClient().transaction(...args),
  batch: (...args: Parameters<Client['batch']>) => getClient().batch(...args),
} as Client

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