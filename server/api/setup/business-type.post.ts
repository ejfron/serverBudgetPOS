import db from '../../db/connection'
import { isValidBusinessType } from '../../../shared/types/business.types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { branch_id, business_type } = body

  if (!branch_id || !business_type) {
    throw createError({ statusCode: 400, statusMessage: 'branch_id and business_type are required' })
  }

  if (!isValidBusinessType(business_type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid business type' })
  }

  // Check if branch exists
  const branch = db.prepare('SELECT id FROM branches WHERE id = ?').get(branch_id)
  if (!branch) {
    throw createError({ statusCode: 404, statusMessage: 'Branch not found' })
  }

  db.prepare('UPDATE branches SET business_type = ? WHERE id = ?').run(business_type, branch_id)

  return { success: true, business_type }
})