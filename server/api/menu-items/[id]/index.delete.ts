// @ts-nocheck
import db from '../../../db/connection'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  db.prepare('UPDATE menu_items SET is_available = 0 WHERE id = ?').run(id)
  return { success: true }
})
