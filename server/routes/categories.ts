import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import db from '../db/connection.js'

const router = Router()

router.get('/', (_req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all()
  return res.json(categories)
})

router.post('/', (req, res) => {
  const { name } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name required' })
  }
  const trimmed = name.trim()

  const existing = db.prepare('SELECT * FROM categories WHERE LOWER(name) = LOWER(?)').get(trimmed) as any
  if (existing) return res.json(existing)

  const id = randomUUID()
  db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)').run(id, trimmed)
  return res.status(201).json({ id, name: trimmed })
})

export default router