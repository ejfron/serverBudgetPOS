// @ts-nocheck
import db from '../db/connection'
export default defineEventHandler(() => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get()
  return settings ?? { business_name: 'My Business' }
})
