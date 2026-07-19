// server/routes/create-test-user.get.ts
import bcrypt from 'bcrypt'
import Database from 'better-sqlite3'

export default defineEventHandler(() => {
  const db = new Database('./database/tapsilogan.db')
  
  // Drop and recreate users table to start fresh
  db.exec(`
    DROP TABLE IF EXISTS users
  `)
  
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('front', 'kitchen', 'admin')),
      branch_id INTEGER,
      full_name TEXT,
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    )
  `)
  
  // Get first branch
  const branch = db.prepare('SELECT id FROM branches LIMIT 1').get() as any
  
  if (!branch) {
    // Create branch if not exists
    db.prepare('INSERT INTO branches (name) VALUES (?)').run('Main Branch')
    const newBranch = db.prepare('SELECT id FROM branches LIMIT 1').get() as any
    var branchId = newBranch.id
  } else {
    var branchId = branch.id
  }
  
  const password = 'admin123'
  const passwordHash = bcrypt.hashSync(password, 10)
  
  // Verify the hash works
  const testVerify = bcrypt.compareSync(password, passwordHash)
  
  db.prepare(`
    INSERT INTO users (username, password_hash, role, branch_id, full_name)
    VALUES ('admin', ?, 'front', ?, 'Admin User')
  `).run(passwordHash, branchId)
  
  // Verify user was created correctly
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin') as any
  
  return {
    success: true,
    message: 'Test user created!',
    password: password,
    hash: passwordHash,
    hash_verification: testVerify,
    user_created: !!user,
    user_data: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  }
})