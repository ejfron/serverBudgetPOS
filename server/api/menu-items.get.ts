import db from '../db/connection'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const branchId = query.branch_id as string | undefined

  if (!branchId) {
    throw createError({ statusCode: 400, statusMessage: 'branch_id required' })
  }

  const items = db.prepare(`
    SELECT id, name, category, price, is_available, created_at, image_url, branch_id, wholesale_price
    FROM menu_items
    WHERE is_available = 1 AND branch_id = ?
    ORDER BY category, name
  `).all(branchId)

  return { success: true, data: items }
})