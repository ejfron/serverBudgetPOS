import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import db from '../db/connection.js'
import { isValidBusinessType } from '../../shared/types/business.types.js'

const router = Router()

// POST /api/setup/complete — create admin account
router.post('/complete', (req, res) => {
  const { businessName, username, password } = req.body

  if (!businessName || !username || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
  }
  if (username.length < 3) {
    return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' })
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Username already exists. Please choose a different one.' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const branchId = randomUUID()
  const userId = randomUUID()

  db.exec('BEGIN')
  try {
    db.prepare('INSERT INTO branches (id, name, business_type) VALUES (?, ?, ?)').run(branchId, businessName.trim(), '')
    db.prepare(`
      INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
      VALUES (?, ?, ?, 'admin', ?, ?)
    `).run(userId, username.trim(), hash, branchId, username.trim())

    try {
      db.prepare(`
        INSERT INTO settings (id, business_name, updated_at)
        VALUES (1, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          business_name = excluded.business_name,
          updated_at = excluded.updated_at
      `).run(businessName.trim())
    } catch {
      // settings table optional
    }

    db.exec('COMMIT')
  } catch (err: any) {
    db.exec('ROLLBACK')
    console.error('Account creation failed:', err)
    return res.status(500).json({ success: false, message: err.message || 'Failed to create account. Please try again.' })
  }

  return res.status(201).json({
    success: true,
    user: {
      id: userId,
      username: username.trim(),
      role: 'admin',
      branch_id: branchId,
      branch_name: businessName.trim(),
      business_type: '',
      full_name: username.trim(),
    },
  })
})

// POST /api/setup/business-type
router.post('/business-type', (req, res) => {
  const { branch_id, business_type } = req.body

  if (!branch_id || !business_type) {
    return res.status(400).json({ success: false, message: 'branch_id and business_type are required' })
  }
  if (!isValidBusinessType(business_type)) {
    return res.status(400).json({ success: false, message: 'Invalid business type' })
  }

  const branch = db.prepare('SELECT id FROM branches WHERE id = ?').get(branch_id)
  if (!branch) {
    return res.status(404).json({ success: false, message: 'Branch not found' })
  }

  db.prepare('UPDATE branches SET business_type = ? WHERE id = ?').run(business_type, branch_id)
  return res.json({ success: true, business_type })
})

export default router