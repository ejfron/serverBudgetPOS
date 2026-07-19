import { Router } from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import db from '../db/connection.js'
import { hasKitchen } from '../../shared/types/business.types.js'

const router = Router()

// Returns branches with their cashier/kitchen usernames + password hashes joined in,
// matching the shape admin/branches.vue expects.
router.get('/', (_req, res) => {
  const branches = db.prepare(`
    SELECT
      b.id, b.name, b.address, b.business_type, b.created_at,
      cashier.username as cashierUsername,
      cashier.password_hash as cashierPasswordHash,
      kitchen.username as kitchenUsername,
      kitchen.password_hash as kitchenPasswordHash
    FROM branches b
    LEFT JOIN users cashier ON cashier.branch_id = b.id AND cashier.role = 'front'
    LEFT JOIN users kitchen ON kitchen.branch_id = b.id AND kitchen.role = 'kitchen'
    ORDER BY b.name
  `).all()

  return res.json(branches)
})

// Bulk create branches, each with a cashier account and (if the business
// type has a kitchen) a kitchen account too.
router.post('/', (req, res) => {
  const { branches } = req.body

  if (!Array.isArray(branches) || branches.length === 0) {
    return res.status(400).json({ success: false, message: 'No branches provided' })
  }

  try {
    const insertBranch = db.prepare(`
      INSERT INTO branches (id, name, address, business_type)
      VALUES (?, ?, ?, ?)
    `)
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const createAll = db.transaction((rows: any[]) => {
      for (const b of rows) {
        if (!b.name || !b.cashierUsername || !b.cashierPassword) {
          throw new Error(`Missing required fields for branch: ${JSON.stringify(b)}`)
        }

        const businessType = b.business_type || 'tapsilogan'
        const branchId = randomUUID()

        insertBranch.run(branchId, b.name, b.location || null, businessType)

        const cashierHash = bcrypt.hashSync(b.cashierPassword, 10)
        insertUser.run(randomUUID(), b.cashierUsername, cashierHash, 'front', branchId, b.name)

        // Only create a kitchen account if this business type actually has one
        if (hasKitchen(businessType) && b.kitchenUsername && b.kitchenPassword) {
          const kitchenHash = bcrypt.hashSync(b.kitchenPassword, 10)
          insertUser.run(randomUUID(), b.kitchenUsername, kitchenHash, 'kitchen', branchId, b.name)
        }
      }
    })

    createAll(branches)

    return res.status(201).json({ success: true, message: `${branches.length} branch(es) created` })
  } catch (err: any) {
    console.error('Create branches error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Failed to create branches' })
  }
})

export default router