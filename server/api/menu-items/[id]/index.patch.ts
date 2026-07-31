// @ts-nocheck
import db from '../../../db/connection'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (body.is_available !== undefined || body.stock_status !== undefined) {
    // Add column if missing
    db.exec('ALTER TABLE menu_items ADD COLUMN stock_status TEXT DEFAULT "available"')

    const isAvail = body.is_available === true || body.is_available === 1 ? 1 : 0
    const stock = body.stock_status || 'available'

    db.prepare('UPDATE menu_items SET is_available = ?, stock_status = ? WHERE id = ?').run(isAvail, stock, id)
    return { success: true }
  }

  if (body.name) {
    db.prepare('UPDATE menu_items SET name = ?, category = ?, price = ? WHERE id = ?').run(
      body.name, body.category, Number(body.price), id
    )
    return { success: true }
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
})
