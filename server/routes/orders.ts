import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import db from '../db/connection.js'
import { broadcast } from '../websocket/orderSocket.js'

const router = Router()

// GET /api/orders
router.get('/', (req, res) => {
  const { branch_id, status } = req.query

  if (!branch_id) {
    return res.status(400).json({ success: false, message: 'branch_id required' })
  }

  let query = `
    SELECT o.*,
      json_group_array(
        json_object(
          'id', oi.id,
          'order_id', oi.order_id,
          'menu_item_id', oi.menu_item_id,
          'item_name', oi.item_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.subtotal,
          'price_type', oi.price_type
        )
      ) as order_items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.branch_id = ?
  `
  const params: any[] = [branch_id]

  if (status) {
    query += ` AND o.status = ?`
    params.push(status)
  }

  query += ` GROUP BY o.id ORDER BY o.created_at ASC`

  const orders = db.prepare(query).all(...params) as any[]
  const parsed = orders.map(o => ({
    ...o,
    order_items: JSON.parse(o.order_items).filter((i: any) => i.id !== null),
  }))

  return res.json({ success: true, data: parsed })
})

// POST /api/orders
router.post('/', (req, res) => {
  const { branch_id, created_by, items, payment_method = 'cash', order_type = 'dine-in', notes_type = '' } = req.body

  if (!branch_id || !created_by || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing required fields' })
  }

  const total = items.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0)

  const lastOrder = db.prepare(
    `SELECT MAX(order_number) as last FROM orders WHERE branch_id = ?`
  ).get(branch_id) as { last: number | null }

  const orderNumber = (lastOrder.last ?? 0) + 1
  const orderId = randomUUID()
  const now = new Date().toISOString()

  db.exec('BEGIN')
  try {
    db.prepare(`
      INSERT INTO orders (id, branch_id, status, order_number, created_by, total_amount, payment_method, order_type, notes_type, created_at)
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, branch_id, orderNumber, created_by, total, payment_method, order_type, notes_type, now)

    for (const item of items) {
      db.prepare(`
        INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, subtotal, price_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(), orderId, item.menu_item_id, item.name,
        item.quantity, item.unit_price, item.unit_price * item.quantity,
        item.price_type ?? 'regular',
      )
    }

    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    console.error('Order insert failed:', err)
    return res.status(500).json({ success: false, message: 'Failed to create order' })
  }

  const full = db.prepare(`
    SELECT o.*,
      json_group_array(
        json_object(
          'id', oi.id,
          'order_id', oi.order_id,
          'menu_item_id', oi.menu_item_id,
          'item_name', oi.item_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.subtotal,
          'price_type', oi.price_type
        )
      ) as order_items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ?
    GROUP BY o.id
  `).get(orderId) as any

  const result = {
    ...full,
    order_items: JSON.parse(full.order_items).filter((i: any) => i.id !== null),
  }

  broadcast(branch_id as string, { type: 'ORDER_CREATED', order: result })

  return res.status(201).json({ success: true, data: result })
})

// PATCH /api/orders/:id
router.patch('/:id', (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!['ready', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' })
  }

  const now = new Date().toISOString()

  if (status === 'ready') {
    db.prepare(`UPDATE orders SET status = 'ready', ready_at = ? WHERE id = ?`).run(now, id)
  } else {
    db.prepare(`UPDATE orders SET status = 'completed', completed_at = ? WHERE id = ?`).run(now, id)
  }

  const updated = db.prepare(`
    SELECT o.*,
      json_group_array(
        json_object(
          'id', oi.id,
          'order_id', oi.order_id,
          'menu_item_id', oi.menu_item_id,
          'item_name', oi.item_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.subtotal,
          'price_type', oi.price_type
        )
      ) as order_items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ?
    GROUP BY o.id
  `).get(id) as any

  const result = {
    ...updated,
    order_items: JSON.parse(updated.order_items).filter((i: any) => i.id !== null),
  }

  broadcast(result.branch_id, { type: 'ORDER_UPDATED', order: result })

  return res.json({ success: true, data: result })
})

// DELETE /api/orders/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params

  db.exec('BEGIN')
  try {
    db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(id)
    db.prepare(`DELETE FROM orders WHERE id = ?`).run(id)
    db.exec('COMMIT')
    return res.json({ success: true })
  } catch (err) {
    db.exec('ROLLBACK')
    console.error('Order delete failed:', err)
    return res.status(500).json({ success: false, message: 'Failed to delete order' })
  }
})

export default router