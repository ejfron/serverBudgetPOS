// @ts-nocheck
import db from '../../../../db/connection'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id)
  db.prepare('DELETE FROM orders WHERE id = ?').run(id)
  return { success: true }
})
