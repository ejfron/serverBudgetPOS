// @ts-nocheck
import db from '../../../db/connection'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id'); const body = await readBody(event)
  const { name, category, price } = body
  db.prepare('UPDATE menu_items SET name = ?, category = ?, price = ? WHERE id = ?').run(name, category, price, id)
  return { success: true }
})
