import db from '../../db/connection'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { businessName, username, password } = body

  if (!businessName || !username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'All fields are required' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 6 characters' })
  }

  if (username.length < 3) {
    throw createError({ statusCode: 400, statusMessage: 'Username must be at least 3 characters' })
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existingUser) {
    throw createError({ 
      statusCode: 409, 
      statusMessage: 'Username already exists. Please choose a different username.' 
    })
  }

  const hash = bcrypt.hashSync(password, 10)
  const branchId = uuidv4()
  const userId = uuidv4()

  const createAccount = db.transaction(() => {
    // ✅ Create branch without business_type (uses DB default)
    db.prepare('INSERT INTO branches (id, name) VALUES (?, ?)').run(branchId, businessName)
    // ✅ Then set to empty to force setup page
    db.prepare("UPDATE branches SET business_type = '' WHERE id = ?").run(branchId)

    // Create admin user
    db.prepare(`
      INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
      VALUES (?, ?, ?, 'admin', ?, ?)
    `).run(userId, username, hash, branchId, username)

    // Update settings
    db.prepare(`
      INSERT INTO settings (id, business_name, updated_at) 
      VALUES (1, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET 
        business_name = excluded.business_name,
        updated_at = excluded.updated_at
    `).run(businessName)
  })

  try {
    createAccount()
    
    const userData = {
      id: userId,
      username: username,
      role: 'admin',
      branch_id: branchId,
      branch_name: businessName,
      business_type: '',              // ✅ Empty to force setup
      full_name: username
    }

    return { 
      success: true,
      user: userData
    }
  } catch (error: any) {
    console.error('Account creation failed:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to create account. Please try again.' 
    })
  }
})