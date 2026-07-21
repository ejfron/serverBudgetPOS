// reset-sales.js
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'database', 'tapsilogan.db')
const db = new Database(dbPath)

db.prepare('DELETE FROM orders').run()

console.log('All sales data has been reset.')
db.close()