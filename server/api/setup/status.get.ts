import db from '../../db/connection'

export default defineEventHandler(() => {
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get()
  return { needsSetup: !admin }
})