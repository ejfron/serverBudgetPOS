import db from '../db/connection'

export default defineEventHandler(() => {
  const branches = db.prepare(`
    SELECT 
      b.id,
      b.name,
      b.address,
      b.created_at,
      (SELECT u.username FROM users u WHERE u.branch_id = b.id AND u.role = 'front' LIMIT 1) AS cashierUsername,
      (SELECT u.username FROM users u WHERE u.branch_id = b.id AND u.role = 'kitchen' LIMIT 1) AS kitchenUsername,
      (SELECT u.password_hash FROM users u WHERE u.branch_id = b.id AND u.role = 'front' LIMIT 1) AS cashierPasswordHash,
      (SELECT u.password_hash FROM users u WHERE u.branch_id = b.id AND u.role = 'kitchen' LIMIT 1) AS kitchenPasswordHash
    FROM branches b
    ORDER BY b.created_at ASC
  `).all()

  return branches
})