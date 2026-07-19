import db from '../../db/connection'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { items } = body

  if (!Array.isArray(items) || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one item is required' })
  }

  const insert = db.prepare(`
    INSERT INTO menu_items (id, name, category, price, is_available)
    VALUES (?, ?, ?, ?, 1)
  `)

  const transaction = db.transaction(() => {
    for (const item of items) {
      if (!item.name || !item.category || item.price == null) {
        throw createError({ statusCode: 400, statusMessage: 'Each item must have name, category, and price' })
      }
      insert.run(uuidv4(), item.name, item.category, item.price)
    }
  })

  transaction()
  return { success: true }
})