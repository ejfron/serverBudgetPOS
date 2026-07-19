import db from '../db/connection'

export default defineEventHandler(() => {
  const items = db.prepare(`
    SELECT id, name, category, price, is_available, created_at
    FROM menu_items
    WHERE is_available = 1
    ORDER BY category, name
  `).all()

  return { success: true, data: items }
})