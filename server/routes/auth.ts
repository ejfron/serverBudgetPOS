import { Router } from 'express'
import bcrypt from 'bcrypt'
import db from '../db/connection.js'

const router = Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' })
  }
  const user = db.prepare(`
    SELECT u.*, b.name as branch_name, b.business_type as business_type
    FROM users u JOIN branches b ON u.branch_id = b.id
    WHERE u.username = ?
  `).get(username) as any

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' })
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      branch_id: user.branch_id,
      branch_name: user.branch_name,
      business_type: user.business_type,
      full_name: user.full_name,
    },
  })
})

router.post('/verify-admin', (req, res) => {
  const { branch_id, password } = req.body

  if (!branch_id || !password) {
    return res.status(400).json({ verified: false, message: 'Missing fields' })
  }

  // Get the branch
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branch_id) as any
  if (!branch) {
    return res.status(404).json({ verified: false, message: 'Branch not found' })
  }

  // Use parent branch ID if this is a child branch, otherwise use itself
  const adminBranchId = branch.created_by_branch || branch.id

  // Find admin for that branch
  const admin = db.prepare('SELECT * FROM users WHERE branch_id = ? AND role = ?').get(adminBranchId, 'admin') as any

  if (!admin) {
    return res.status(404).json({ verified: false, message: 'Admin not found' })
  }

  if (bcrypt.compareSync(password, admin.password_hash)) {
    return res.json({ verified: true })
  }

  return res.status(401).json({ verified: false, message: 'Invalid password' })
})

export default router
