import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import db from '../db/connection.js'

const router = Router()

router.get('/', (req, res) => {
  const { business_type } = req.query

  let query = 'SELECT * FROM categories'
  const params: any[] = []

  if (business_type && business_type !== 'undefined') {
    query += ' WHERE business_type = ?'
    params.push(business_type)
  }

  query += ' ORDER BY name'

  const categories = db.prepare(query).all(...params)
  return res.json(categories)
})

router.post('/', (req, res) => {
  const { name, business_type } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name required' })
  }
  const trimmed = name.trim()
  const bt = business_type || 'tapsilogan'

  const existing = db.prepare(
    'SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND business_type = ?'
  ).get(trimmed, bt) as any
  if (existing) return res.json(existing)

  const id = randomUUID()
  db.prepare('INSERT INTO categories (id, name, business_type) VALUES (?, ?, ?)').run(id, trimmed, bt)
  return res.status(201).json({ id, name: trimmed, business_type: bt })
})

export default router