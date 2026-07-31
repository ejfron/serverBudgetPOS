import db from '../db/connection'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const { branch_id, status } = query

  if (!branch_id) throw createError({ statusCode: 400, statusMessage: 'branch_id required' })

  let sql = `
    SELECT
      o.id,
      o.branch_id,
      o.status,
      o.order_number,
      o.created_by,
      o.total_amount,
      o.payment_method,
      o.order_type,
      o.notes_type,
      o.created_at,
      o.ready_at,
      o.completed_at,
      json_group_array(
        json_object(
          'id', oi.id,
          'order_id', oi.order_id,
          'menu_item_id', oi.menu_item_id,
          'item_name', oi.item_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.subtotal
        )
      ) as order_items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.branch_id = ?
  `
  const params: any[] = [branch_id as string]

  if (status) {
    sql += ` AND o.status = ?`
    params.push(status as string)
  }

  sql += ` GROUP BY o.id ORDER BY o.created_at ASC`

  const orders = db.prepare(sql).all(...params) as any[]

return {
  success: true,
  data: orders.map((o: any) => ({
    ...o,
    order_items: JSON.parse(o.order_items).filter((i: any) => i.id !== null),
  })),
}
})