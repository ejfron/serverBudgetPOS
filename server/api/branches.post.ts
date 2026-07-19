import db from '../db/connection'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'
import { hasKitchen, isValidBusinessType } from '../../shared/types/business.types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { branches } = body

  if (!Array.isArray(branches) || branches.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one branch is required' })
  }

  // Optional: check that the user is admin (we don't have auth in API yet, but it's okay for now)

  const insertBranch = db.prepare('INSERT INTO branches (id, name, address, business_type) VALUES (?, ?, ?, ?)')
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    for (const b of branches) {
      if (!isValidBusinessType(b.business_type)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid or missing business_type for branch "${b.name || '(unnamed)'}"` })
      }

      const branchNeedsKitchen = hasKitchen(b.business_type)

      if (!b.name || !b.cashierUsername || !b.cashierPassword) {
        throw createError({ statusCode: 400, statusMessage: 'Branch name, cashier username, and cashier password are required' })
      }

      if (branchNeedsKitchen && (!b.kitchenUsername || !b.kitchenPassword)) {
        throw createError({ statusCode: 400, statusMessage: `Kitchen username and password are required for ${b.business_type} branches` })
      }

      const branchId = uuidv4()
      insertBranch.run(branchId, b.name, b.location || '', b.business_type)

      // Cashier (always created)
      const cashierId = uuidv4()
      const cashierHash = bcrypt.hashSync(b.cashierPassword, 10)
      insertUser.run(cashierId, b.cashierUsername, cashierHash, 'front', branchId, b.cashierUsername)

      // Kitchen (only for types that have a kitchen side)
      if (branchNeedsKitchen) {
        const kitchenId = uuidv4()
        const kitchenHash = bcrypt.hashSync(b.kitchenPassword, 10)
        insertUser.run(kitchenId, b.kitchenUsername, kitchenHash, 'kitchen', branchId, b.kitchenUsername)
      }
    }
  })

  transaction()

  return { success: true }
})