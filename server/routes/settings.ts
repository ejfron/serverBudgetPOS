import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

router.get('/', (_req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get()
  return res.json(settings ?? { business_name: 'My Business' })
})

export default router