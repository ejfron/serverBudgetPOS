// @ts-nocheck
import db from '../db/connection'
export default defineEventHandler((event) => {
  const query = getQuery(event); const { branch_id, status } = query
  if (!branch_id) throw createError({ statusCode: 400, statusMessage: 'branch_id required' })
  let sql = `SELECT o.*, json_group_array(json_object('id', oi.id, 'order_id', oi.order_id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)) as order_items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.branch_id = ?`
  const params: any[] = [branch_id]
  if (status) { sql += ` AND o.status = ?`; params.push(status) }
  sql += ` GROUP BY o.id ORDER BY o.created_at ASC`
  const orders = db.prepare(sql).all(...params) as any[]
  return { success: true, data: orders.map((o: any) => ({ ...o, order_items: JSON.parse(o.order_items).filter((i: any) => i.id !== null) })) }
})
