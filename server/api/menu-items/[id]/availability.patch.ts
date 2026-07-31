// @ts-nocheck
import db from '../../../db/connection'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { is_available, stock_status } = body

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing item ID' })
  }

  try {
    // Add stock_status column if it doesn't exist
    try {
      db.exec('ALTER TABLE menu_items ADD COLUMN stock_status TEXT DEFAULT "available"')
    } catch {}

    db.prepare(`
      UPDATE menu_items 
      SET is_available = ?, stock_status = ?
      WHERE id = ?
    `).run(
      is_available ? 1 : 0,
      stock_status || (is_available ? 'available' : 'out_of_stock'),
      id
    )

    const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id)

    return {
      success: true,
      data: {
        ...updated,
        is_available: !!updated?.is_available,
      },
    }
  } catch (error) {
    console.error('Error updating availability:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update availability',
    })
  }
})
