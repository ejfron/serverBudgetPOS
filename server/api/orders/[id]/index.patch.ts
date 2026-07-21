// @ts-nocheck
import db from '../../../db/connection'
import { randomUUID } from 'node:crypto'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id'); const body = await readBody(event)
  const { status, payment_method, order_items, total_amount } = body
  const now = new Date().toISOString()
  if (status) {
    if (status === 'ready') db.prepare(`UPDATE orders SET status = 'ready', ready_at = ? WHERE id = ?`).run(now, id)
    else if (status === 'completed') db.prepare(`UPDATE orders SET status = 'completed', completed_at = ? WHERE id = ?`).run(now, id)
    else db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id)
  }
  if (order_items && total_amount) {
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id)
    for (const item of order_items) db.prepare('INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), id, item.menu_item_id || null, item.item_name, item.quantity, item.unit_price, item.subtotal || item.quantity * item.unit_price)
    payment_method ? db.prepare('UPDATE orders SET total_amount = ?, payment_method = ? WHERE id = ?').run(total_amount, payment_method, id) : db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(total_amount, id)
  }
  if (payment_method && !order_items) db.prepare('UPDATE orders SET payment_method = ? WHERE id = ?').run(payment_method, id)
  return { success: true }
})
