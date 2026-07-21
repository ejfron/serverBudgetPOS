import { Router } from 'express'
import db from '../db/connection.js'
import { isValidBusinessType } from '../../shared/types/business.types.js'

const router = Router()

router.post('/', (req, res) => {
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
