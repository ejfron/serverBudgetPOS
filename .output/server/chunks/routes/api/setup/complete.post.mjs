import { d as defineEventHandler, r as readBody, c as createError, a as db } from '../../../nitro/nitro.mjs';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import '@libsql/client';
import 'node:url';
import '@iconify/utils';
import 'consola';

const complete_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { businessName, username, password } = body;
  if (!businessName || !username || !password) {
    throw createError({ statusCode: 400, statusMessage: "All fields are required" });
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least 6 characters" });
  }
  if (username.length < 3) {
    throw createError({ statusCode: 400, statusMessage: "Username must be at least 3 characters" });
  }
  const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: "Username already exists. Please choose a different username."
    });
  }
  const hash = bcrypt.hashSync(password, 10);
  const branchId = randomUUID();
  const userId = randomUUID();
  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO branches (id, name) VALUES (?, ?)").run(branchId, businessName);
    db.prepare("UPDATE branches SET business_type = '' WHERE id = ?").run(branchId);
    db.prepare(`
      INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
      VALUES (?, ?, ?, 'admin', ?, ?)
    `).run(userId, username, hash, branchId, username);
    db.prepare(`
      INSERT INTO settings (id, business_name, updated_at)
      VALUES (1, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        business_name = excluded.business_name,
        updated_at = excluded.updated_at
    `).run(businessName);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    console.error("Account creation failed:", err);
    throw createError({
      statusCode: 500,
      statusMessage: (err == null ? void 0 : err.message) || "Failed to create account. Please try again."
    });
  }
  return {
    success: true,
    user: {
      id: userId,
      username,
      role: "admin",
      branch_id: branchId,
      branch_name: businessName,
      business_type: "",
      full_name: username
    }
  };
});

export { complete_post as default };
//# sourceMappingURL=complete.post.mjs.map
