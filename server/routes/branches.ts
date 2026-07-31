import { Router } from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import db from '../db/connection.js'
import { hasKitchen } from '../../shared/types/business.types.js'

const router = Router()


router.get('/', (req, res) => {
 
  const admin_branch_id = req.query.admin_branch_id as string | undefined

  if (!admin_branch_id) {
    return res.status(400).json({ success: false, message: 'admin_branch_id required' })
  }


  const branches = db.prepare(`
    SELECT
      b.id,
      b.name,
      b.address,
      b.business_type,
      b.created_at,
      b.created_by_branch,
      cashier.username   AS cashierUsername,
      kitchen.username   AS kitchenUsername
    FROM branches b
    LEFT JOIN users cashier ON cashier.branch_id = b.id AND cashier.role = 'front'
    LEFT JOIN users kitchen ON kitchen.branch_id = b.id AND kitchen.role = 'kitchen'
    WHERE b.id = ? OR b.created_by_branch = ?
    ORDER BY b.created_at ASC
  `).all(admin_branch_id, admin_branch_id)  
  return res.json(branches)
})


router.post('/', (req, res) => {
  const { branches, admin_branch_id } = req.body

  if (!admin_branch_id) {
    return res.status(400).json({ success: false, message: 'admin_branch_id required' })
  }
  if (!Array.isArray(branches) || branches.length === 0) {
    return res.status(400).json({ success: false, message: 'No branches provided' })
  }

  const adminBranch = db.prepare('SELECT id, business_type FROM branches WHERE id = ?').get(admin_branch_id as string) as any
  if (!adminBranch) {
    return res.status(404).json({ success: false, message: 'Admin branch not found' })
  }

  const created: string[] = []

  db.exec('BEGIN')
  try {
    for (const b of branches) {
      if (!b.name || !b.cashierUsername || !b.cashierPassword) {
        throw new Error(`Missing required fields for branch: ${b.name || '(unnamed)'}`)
      }

      const businessType = b.business_type || adminBranch.business_type || 'tapsilogan'
      const branchId = randomUUID()

      db.prepare(`
        INSERT INTO branches (id, name, address, business_type, created_by_branch)
        VALUES (?, ?, ?, ?, ?)
      `).run(branchId, b.name.trim(), b.address || b.location || null, businessType, admin_branch_id)

      // Cashier
      let cashierUsername = b.cashierUsername.trim()
      let counter = 1
      while (db.prepare('SELECT id FROM users WHERE username = ?').get(cashierUsername)) {
        cashierUsername = `${b.cashierUsername.trim()}${counter}`
        counter++
      }
      const cashierHash = bcrypt.hashSync(b.cashierPassword, 10)
      db.prepare(`
        INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
        VALUES (?, ?, ?, 'front', ?, ?)
      `).run(randomUUID(), cashierUsername, cashierHash, branchId, b.name.trim())

      // Kitchen
      const createKitchen = b.has_kitchen !== undefined
        ? b.has_kitchen
        : hasKitchen(businessType)

      if (createKitchen && b.kitchenUsername && b.kitchenPassword) {
        let kitchenUsername = b.kitchenUsername.trim()
        let kCounter = 1
        while (db.prepare('SELECT id FROM users WHERE username = ?').get(kitchenUsername)) {
          kitchenUsername = `${b.kitchenUsername.trim()}${kCounter}`
          kCounter++
        }
        const kitchenHash = bcrypt.hashSync(b.kitchenPassword, 10)
        db.prepare(`
          INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
          VALUES (?, ?, ?, 'kitchen', ?, ?)
        `).run(randomUUID(), kitchenUsername, kitchenHash, branchId, b.name.trim())
      }

      created.push(branchId)
    }

    db.exec('COMMIT')
    return res.status(201).json({
      success: true,
      message: `${created.length} branch(es) created successfully`,
      branch_ids: created,
    })
  } catch (err: any) {
    db.exec('ROLLBACK')
    console.error('Create branches error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Failed to create branches' })
  }
})


router.patch('/:id', (req, res) => {
  const { id } = req.params
  const { name, address, admin_branch_id } = req.body

  const branch = db.prepare(`
    SELECT id FROM branches
    WHERE id = ? AND (id = ? OR created_by_branch = ?)
  `).get(id, admin_branch_id, admin_branch_id) as any

  if (!branch) {
    return res.status(403).json({ success: false, message: 'Branch not found or access denied' })
  }

  db.prepare(`UPDATE branches SET name = ?, address = ? WHERE id = ?`)
    .run(name, address || null, id)

  return res.json({ success: true })
})


router.delete('/:id', (req, res) => {
  const { id } = req.params

  const admin_branch_id = req.query.admin_branch_id as string | undefined

  if (id === admin_branch_id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own branch' })
  }

  const branch = db.prepare(`
    SELECT id FROM branches WHERE id = ? AND created_by_branch = ?
  `).get(id, admin_branch_id as string) as any  

  if (!branch) {
    return res.status(403).json({ success: false, message: 'Branch not found or access denied' })
  }

  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE branch_id = ?)').run(id)
    db.prepare('DELETE FROM orders WHERE branch_id = ?').run(id)
    db.prepare('DELETE FROM users WHERE branch_id = ?').run(id)
    db.prepare('DELETE FROM branches WHERE id = ?').run(id)
    db.exec('COMMIT')
    return res.json({ success: true })
  } catch (err: any) {
    db.exec('ROLLBACK')
    return res.status(500).json({ success: false, message: 'Failed to delete branch' })
  }
})

export default router