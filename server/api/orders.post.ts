import db from '../db/connection'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { 
    branch_id, 
    created_by, 
    items, 
    payment_method = 'cash', 
    order_type = 'dine-in', 
    notes_type = '' 
  } = body

  // Validate required fields
  if (!branch_id || !created_by || !Array.isArray(items) || items.length === 0) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Missing required fields: branch_id, created_by, and items are required' 
    })
  }

  if (!order_type) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'order_type is required' 
    })
  }

  // Validate order_type values
  if (!['dine-in', 'take-out'].includes(order_type)) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'order_type must be either "dine-in" or "take-out"' 
    })
  }

  // Calculate total amount
  const total_amount = items.reduce((sum: number, item: any) => {
    if (!item.unit_price || !item.quantity) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Each item must have unit_price and quantity' 
      })
    }
    return sum + item.unit_price * item.quantity
  }, 0)

  // Get next order number
  const lastOrder = db.prepare(`
    SELECT MAX(order_number) as maxNum 
    FROM orders 
    WHERE branch_id = ?
  `).get(branch_id) as { maxNum: number | null }
  
  const order_number = (lastOrder?.maxNum || 0) + 1

  const orderId = uuidv4()
  const pm = payment_method || 'cash'
  const noteText = notes_type || ''

  // Prepare statements
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, 
      branch_id, 
      order_number, 
      created_by, 
      total_amount, 
      status, 
      payment_method, 
      order_type, 
      notes_type, 
      created_at
    )
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, datetime('now'))
  `)

  const insertItem = db.prepare(`
    INSERT INTO order_items (
      id, 
      order_id, 
      menu_item_id, 
      item_name, 
      quantity, 
      unit_price, 
      subtotal
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  // Execute transaction
  db.exec('BEGIN')
  try {
    insertOrder.run(
      orderId, 
      branch_id, 
      order_number, 
      created_by, 
      total_amount, 
      pm, 
      order_type, 
      noteText
    )

    for (const item of items) {
      const subtotal = item.unit_price * item.quantity
      insertItem.run(
        uuidv4(), 
        orderId, 
        item.menu_item_id, 
        item.name, 
        item.quantity, 
        item.unit_price, 
        subtotal
      )
    }

    db.exec('COMMIT')
  } catch (error: any) {
    db.exec('ROLLBACK')
    console.error('Transaction failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create order',
    })
  }

  // Fetch the created order with all details
  const order = db.prepare(`
    SELECT 
      o.*,
      b.name as branch_name
    FROM orders o 
    JOIN branches b ON o.branch_id = b.id
    WHERE o.id = ?
  `).get(orderId) as Record<string, any>

  // Fetch order items separately
  const orderItems = db.prepare(`
    SELECT * FROM order_items WHERE order_id = ?
  `).all(orderId)

  // Debug log to verify notes_type is included
  console.log('✅ Order created:', {
    id: order.id,
    order_number: order.order_number,
    notes_type: order.notes_type,
    order_type: order.order_type
  })

  return { 
    success: true, 
    data: { 
      ...order, 
      order_items: orderItems 
    } 
  }
})