// @ts-nocheck
import bcrypt from 'bcrypt'
import db from '../../db/connection'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { branch_id, password } = body

  if (!branch_id || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
  }

  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branch_id) as any
  if (!branch) {
    throw createError({ statusCode: 404, statusMessage: 'Branch not found' })
  }

  const adminBranchId = branch.created_by_branch || branch.id

  const admin = db.prepare('SELECT * FROM users WHERE branch_id = ? AND role = ?').get(adminBranchId, 'admin') as any

  if (!admin) {
    throw createError({ statusCode: 404, statusMessage: 'Admin not found' })
  }

  if (bcrypt.compareSync(password, admin.password_hash)) {
    return { verified: true }
  }

  throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
})
