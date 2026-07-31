import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import db from '../db/connection.js'

const router = Router()

// Setup image upload
const uploadDir = path.join(process.cwd(), 'public/uploads/menu')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only image files allowed'))
  },
})

// GET /api/menu-items — MUST filter by branch_id
router.get('/', (req, res) => {
  const { branch_id, business_type } = req.query

  if (!branch_id) {
    return res.status(400).json({ success: false, message: 'branch_id required' })
  }

  let query = `
    SELECT * FROM menu_items
    WHERE is_available = 1 AND branch_id = ?
  `
  const params: any[] = [branch_id]

  if (business_type) {
    query += ` AND business_type = ?`
    params.push(business_type)
  }

  query += ` ORDER BY category, name`

  const items = db.prepare(query).all(...params)
  return res.json({ success: true, data: items })
})


router.get('/all', (req, res) => {
  const { branch_id, business_type } = req.query

  if (!branch_id) {
    return res.status(400).json({ success: false, message: 'branch_id required' })
  }

  let query = `SELECT * FROM menu_items WHERE branch_id = ?`
  const params: any[] = [branch_id]

  if (business_type) {
    query += ` AND business_type = ?`
    params.push(business_type)
  }

  query += ` ORDER BY category, name`

  const items = db.prepare(query).all(...params) as any[]
  return res.json({
    success: true,
    data: items.map(i => ({ ...i, is_available: !!i.is_available })),
  })
})

// ✅ PATCH /api/menu-items/:id/availability — JSON endpoint for stock updates (NO multer)
router.patch('/:id/availability', (req, res) => {
  const { id } = req.params
  const { is_available, stock_status } = req.body

  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as any
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' })
  }

  // Ensure stock_status column exists
  try { db.exec('ALTER TABLE menu_items ADD COLUMN stock_status TEXT DEFAULT "available"') } catch {}

  let isAvailableValue = item.is_available
  if (is_available !== undefined) {
    isAvailableValue = (is_available === true || is_available === 'true' || is_available === 1 || is_available === '1') ? 1 : 0
  }

  const stockStatusValue = stock_status ?? item.stock_status ?? (isAvailableValue ? 'available' : 'out_of_stock')

  db.prepare('UPDATE menu_items SET is_available = ?, stock_status = ? WHERE id = ?').run(
    isAvailableValue, stockStatusValue, id
  )

  const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as any
  return res.json({ success: true, data: { ...updated, is_available: !!updated.is_available } })
})

router.post('/', upload.single('image'), (req, res) => {
  const { name, category, price, business_type, branch_id, wholesale_price } = req.body

  if (!name || price == null) {
    return res.status(400).json({ success: false, message: 'name and price required' })
  }

  if (!branch_id) {
    return res.status(400).json({ success: false, message: 'branch_id required' })
  }

  const id = randomUUID()
  const imageUrl = req.file ? `/uploads/menu/${req.file.filename}` : null

  const wholesalePriceValue =
    wholesale_price !== undefined && wholesale_price !== null && wholesale_price !== ''
      ? Number(wholesale_price)
      : null

  db.prepare(`
    INSERT INTO menu_items (id, name, category, price, business_type, branch_id, is_available, image_url, wholesale_price, stock_status)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 'available')
  `).run(id, name.trim(), category ?? 'silog', Number(price), business_type ?? '', branch_id, imageUrl, wholesalePriceValue)

  return res.status(201).json({
    success: true,
    data: {
      id, name, category, price: Number(price), business_type, branch_id,
      image_url: imageUrl, wholesale_price: wholesalePriceValue,
      is_available: true, stock_status: 'available',
    },
  })
})

// POST /api/menu-items/bulk
router.post('/bulk', (req, res) => {
  const { items, business_type, branch_id } = req.body

  if (!branch_id) {
    return res.status(400).json({ success: false, message: 'branch_id required' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items provided' })
  }

  db.exec('BEGIN')
  try {
    for (const item of items) {
      if (!item.name || item.price == null) continue
      db.prepare(`
        INSERT INTO menu_items (id, name, category, price, business_type, branch_id, is_available, image_url)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        randomUUID(),
        item.name.trim(),
        item.category ?? 'silog',
        Number(item.price),
        item.business_type ?? business_type ?? '',
        item.branch_id ?? branch_id,
        item.image_url ?? null,
      )
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    console.error('Bulk insert failed:', err)
    return res.status(500).json({ success: false, message: 'Failed to insert menu items' })
  }

  return res.status(201).json({ success: true })
})

// PATCH /api/menu-items/:id — with image upload (multer)
router.patch('/:id', upload.single('image'), (req, res) => {
  const { id } = req.params
  const { name, category, price, is_available, branch_id, wholesale_price, stock_status } = req.body

  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as any
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' })
  }

  if (branch_id && item.branch_id && item.branch_id !== branch_id) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  let imageUrl = item.image_url
  if (req.file) {
    if (item.image_url) {
      const oldPath = path.join(process.cwd(), 'public', item.image_url)
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    }
    imageUrl = `/uploads/menu/${req.file.filename}`
  }

  const wholesalePriceValue =
    wholesale_price !== undefined && wholesale_price !== null && wholesale_price !== ''
      ? Number(wholesale_price)
      : (wholesale_price === '' ? null : item.wholesale_price)

  let isAvailableValue = item.is_available
  if (is_available !== undefined) {
    isAvailableValue = (is_available === true || is_available === 'true' || is_available === 1 || is_available === '1') ? 1 : 0
  }

  const stockStatusValue = stock_status ?? item.stock_status ?? (isAvailableValue ? 'available' : 'out_of_stock')

  db.prepare(`
    UPDATE menu_items
    SET name = ?, category = ?, price = ?, is_available = ?, image_url = ?, wholesale_price = ?, stock_status = ?
    WHERE id = ?
  `).run(
    name ?? item.name,
    category ?? item.category,
    price != null ? Number(price) : item.price,
    isAvailableValue,
    imageUrl,
    wholesalePriceValue,
    stockStatusValue,
    id,
  )

  const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as any

  return res.json({
    success: true,
    data: { ...updated, is_available: !!updated.is_available },
  })
})

// DELETE /api/menu-items/:id — soft delete, verify ownership
router.delete('/:id', (req, res) => {
  const { id } = req.params
  const { branch_id } = req.query

  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as any
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' })
  }

  if (branch_id && item.branch_id && item.branch_id !== branch_id) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  db.prepare('UPDATE menu_items SET is_available = 0 WHERE id = ?').run(id)
  return res.json({ success: true })
})

export default router