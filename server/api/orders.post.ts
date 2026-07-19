import db from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { branch_id, created_by, items } = body

  if (!branch_id || !created_by || !Array.isArray(items) || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const total_amount = items.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0)

  const lastOrder = db.prepare(`
    SELECT MAX(order_number) as maxNum FROM orders WHERE branch_id = ?
  `).get(branch_id) as { maxNum: number | null }
  const order_number = (lastOrder?.maxNum || 0) + 1

  const orderId = uuidv4()

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, branch_id, order_number, created_by, total_amount, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `)
  const insertItem = db.prepare(`
    INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    insertOrder.run(orderId, branch_id, order_number, created_by, total_amount)
    for (const item of items) {
      const subtotal = item.unit_price * item.quantity
      insertItem.run(uuidv4(), orderId, item.menu_item_id, item.name, item.quantity, item.unit_price, subtotal)
    }
  })

  transaction()

  const order = db.prepare(`
    SELECT o.*, b.name as branch_name
    FROM orders o JOIN branches b ON o.branch_id = b.id
    WHERE o.id = ?
  `).get(orderId) as Record<string, any>

  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)

  return { success: true, order: { ...order, order_items: orderItems } }
})