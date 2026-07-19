// server/api/reset-sales.get.ts
import db from '../db/connection'

export default defineEventHandler(() => {
  // Delete all orders
  db.prepare('DELETE FROM orders').run()


  return { message: 'All sales data has been reset successfully.' }
})