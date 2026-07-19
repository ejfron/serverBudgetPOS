import db from '../db/connection'

export default defineEventHandler(() => {
  const columns = db.prepare("PRAGMA table_info(orders)").all()
  return columns
})