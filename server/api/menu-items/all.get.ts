// server/api/menu-items/all.get.ts
import db from '../../db/connection'

export default defineEventHandler((event) => {
  const { branch_id, business_type } = getQuery(event)

  if (!branch_id) {
    throw createError({ statusCode: 400, statusMessage: 'branch_id required' })
  }

  let query = 'SELECT * FROM menu_items WHERE branch_id = ?'
  const params: any[] = [branch_id]

  if (business_type) {
    query += ' AND business_type = ?'
    params.push(business_type)
  }

  query += ' ORDER BY category, name'

  const items = db.prepare(query).all(...params)
  return {
    success: true,
    data: items.map((i: any) => ({ ...i, is_available: !!i.is_available })),
  }
})