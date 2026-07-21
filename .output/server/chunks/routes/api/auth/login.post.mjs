import { d as defineEventHandler, r as readBody, c as createError, a as db } from '../../../nitro/nitro.mjs';
import bcrypt from 'bcrypt';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'better-sqlite3';
import 'path';
import 'fs';
import 'url';
import 'node:url';
import '@iconify/utils';
import 'consola';

const login_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;
  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: "Username and password required" });
  }
  const user = db.prepare(`
    SELECT u.*, b.name as branch_name, b.business_type as business_type
    FROM users u JOIN branches b ON u.branch_id = b.id
    WHERE u.username = ?
  `).get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw createError({ statusCode: 401, statusMessage: "Invalid username or password" });
  }
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      branch_id: user.branch_id,
      branch_name: user.branch_name,
      business_type: user.business_type,
      full_name: user.full_name
    }
  };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
