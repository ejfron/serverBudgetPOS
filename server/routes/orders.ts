import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/connection.js'
import { broadcast } from '../websocket/orderSocket.js'

const router = Router()

router.get('/', (req, res) => {
  const { branch_id, status } = req.query
  if (!branch_id) return res.status(400).json({ success: false, message: 'branch_id required' })
  let query = `SELECT o.*, json_group_array(json_object('id', oi.id, 'order_id', oi.order_id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)) as order_items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.branch_id = ?`
  const params: any[] = [branch_id]
  if (status) { query += ` AND o.status = ?`; params.push(status) }
  query += ` GROUP BY o.id ORDER BY o.created_at ASC`
  const orders = db.prepare(query).all(...params) as any[]
  const parsed = orders.map(o => ({ ...o, order_items: JSON.parse(o.order_items).filter((i: any) => i.id !== null) }))
  return res.json({ success: true, data: parsed })
})

router.post('/', (req, res) => {
  const { branch_id, created_by, cart, items } = req.body
  const orderItems = Array.isArray(cart) ? cart : Array.isArray(items) ? items : []
  if (!branch_id || !created_by || !orderItems?.length) return res.status(400).json({ success: false, message: 'Missing fields' })
  const total = orderItems.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)
  const last = db.prepare('SELECT MAX(order_number) as last FROM orders WHERE branch_id = ?').get(branch_id) as { last: number | null }
  const orderNumber = (last.last ?? 0) + 1
  const orderId = uuidv4()
  const now = new Date().toISOString()
  db.transaction(() => {
    db.prepare('INSERT INTO orders (id, branch_id, status, order_number, created_by, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(orderId, branch_id, 'pending', orderNumber, created_by, total, now)
    for (const item of orderItems) {
      db.prepare('INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)').run(uuidv4(), orderId, item.menu_item_id, item.name, item.quantity, item.unit_price, item.unit_price * item.quantity)
    }
  })()
  const full = db.prepare(`SELECT o.*, json_group_array(json_object('id', oi.id, 'order_id', oi.order_id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)) as order_items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.id = ? GROUP BY o.id`).get(orderId) as any
  const result = { ...full, order_items: JSON.parse(full.order_items).filter((i: any) => i.id !== null) }
  broadcast(branch_id as string, { type: 'ORDER_CREATED', order: result })
  return res.status(201).json({ success: true, data: result })
})

router.patch('/:id', (req, res) => {
  const { id } = req.params
  const { status } = req.body
  if (!['ready', 'completed'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' })
  const now = new Date().toISOString()
  if (status === 'ready') db.prepare(`UPDATE orders SET status = 'ready', ready_at = ? WHERE id = ?`).run(now, id)
  else db.prepare(`UPDATE orders SET status = 'completed', completed_at = ? WHERE id = ?`).run(now, id)
  const updated = db.prepare(`SELECT o.*, json_group_array(json_object('id', oi.id, 'order_id', oi.order_id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)) as order_items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.id = ? GROUP BY o.id`).get(id) as any
  const result = { ...updated, order_items: JSON.parse(updated.order_items).filter((i: any) => i.id !== null) }
  broadcast(result.branch_id, { type: 'ORDER_UPDATED', order: result })
  return res.json({ success: true, data: result })
})

export default router
