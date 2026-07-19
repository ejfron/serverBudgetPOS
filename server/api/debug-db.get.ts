import db from '../db/connection'

export default defineEventHandler(async () => {
  const users = db.prepare('SELECT id, username, role FROM users').all()
  const branches = db.prepare('SELECT id, name FROM branches').all()
  const settings = db.prepare('SELECT * FROM settings').all()
  
  return { users, branches, settings }
})