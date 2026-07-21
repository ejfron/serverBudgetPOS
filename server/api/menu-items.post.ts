// @ts-nocheck
import db from '../db/connection'
import { randomUUID } from 'node:crypto'
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, category, price } = body
  if (!name || price == null) throw createError({ statusCode: 400, statusMessage: 'Name and price required' })
  const id = randomUUID()
  db.prepare('INSERT INTO menu_items (id, name, category, price, is_available) VALUES (?, ?, ?, ?, 1)').run(id, name, category, Number(price))
  return { success: true, data: { id, name, category, price: Number(price) } }
})
