// @ts-nocheck
import db from '../db/connection'
import { randomUUID } from 'node:crypto'
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, business_type } = body
  if (!name || !name.trim()) throw createError({ statusCode: 400, statusMessage: 'Category name required' })
  const trimmed = name.trim(); const bt = business_type || 'tapsilogan'
  const existing = db.prepare('SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND business_type = ?').get(trimmed, bt) as any
  if (existing) return existing
  const id = randomUUID()
  db.prepare('INSERT INTO categories (id, name, business_type) VALUES (?, ?, ?)').run(id, trimmed, bt)
  return { id, name: trimmed, business_type: bt }
})
