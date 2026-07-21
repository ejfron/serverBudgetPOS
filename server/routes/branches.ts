import { Router } from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import db from '../db/connection.js'
import { hasKitchen } from '../../shared/types/business.types.js'

const router = Router()

router.get('/', (req, res) => {
  const { admin_branch_id } = req.query

  let query = `
    SELECT
      b.id, b.name, b.address, b.business_type, b.created_at,
      cashier.username as cashierUsername,
      cashier.password_hash as cashierPasswordHash,
      kitchen.username as kitchenUsername,
      kitchen.password_hash as kitchenPasswordHash
    FROM branches b
    LEFT JOIN users cashier ON cashier.branch_id = b.id AND cashier.role = 'front'
    LEFT JOIN users kitchen ON kitchen.branch_id = b.id AND kitchen.role = 'kitchen'
  `
  const params: any[] = []

  if (admin_branch_id) {
    query += ` WHERE b.id = ? OR b.created_by_branch = ?`
    params.push(admin_branch_id, admin_branch_id)
  }

  query += ` ORDER BY b.name`

  const branches = db.prepare(query).all(...params)

  return res.json(branches)
})

router.post('/', (req, res) => {
  const { branches, admin_branch_id } = req.body

  if (!Array.isArray(branches) || branches.length === 0) {
    return res.status(400).json({ success: false, message: 'No branches provided' })
  }

  try {
    const insertBranch = db.prepare(`
      INSERT INTO branches (id, name, address, business_type, created_by_branch)
      VALUES (?, ?, ?, ?, ?)
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

        insertBranch.run(branchId, b.name, b.location || null, businessType, admin_branch_id || null)

        const cashierHash = bcrypt.hashSync(b.cashierPassword, 10)
        let finalCashierUser = b.cashierUsername
        let counter = 1
        while (db.prepare('SELECT id FROM users WHERE username = ?').get(finalCashierUser)) {
          finalCashierUser = `${b.cashierUsername}${counter}`
          counter++
        }
        insertUser.run(randomUUID(), finalCashierUser, cashierHash, 'front', branchId, b.name)

        const createKitchen = b.has_kitchen !== undefined 
          ? b.has_kitchen 
          : hasKitchen(businessType)

        if (createKitchen && b.kitchenUsername && b.kitchenPassword) {
          let finalKitchenUser = b.kitchenUsername
          let kCounter = 1
          while (db.prepare('SELECT id FROM users WHERE username = ?').get(finalKitchenUser)) {
            finalKitchenUser = `${b.kitchenUsername}${kCounter}`
            kCounter++
          }
          const kitchenHash = bcrypt.hashSync(b.kitchenPassword, 10)
          insertUser.run(randomUUID(), finalKitchenUser, kitchenHash, 'kitchen', branchId, b.name)
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