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

const verifyAdmin_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { branch_id, password } = body;
  if (!branch_id || !password) {
    throw createError({ statusCode: 400, statusMessage: "Missing fields" });
  }
  const branch = db.prepare("SELECT * FROM branches WHERE id = ?").get(branch_id);
  if (!branch) {
    throw createError({ statusCode: 404, statusMessage: "Branch not found" });
  }
  const adminBranchId = branch.created_by_branch || branch.id;
  const admin = db.prepare("SELECT * FROM users WHERE branch_id = ? AND role = ?").get(adminBranchId, "admin");
  if (!admin) {
    throw createError({ statusCode: 404, statusMessage: "Admin not found" });
  }
  if (bcrypt.compareSync(password, admin.password_hash)) {
    return { verified: true };
  }
  throw createError({ statusCode: 401, statusMessage: "Invalid password" });
});

export { verifyAdmin_post as default };
//# sourceMappingURL=verify-admin.post.mjs.map
