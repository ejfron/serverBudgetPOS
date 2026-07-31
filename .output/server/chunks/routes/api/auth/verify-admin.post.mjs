import { d as defineEventHandler, r as readBody, c as createError, a as db } from '../../../nitro/nitro.mjs';
import bcrypt from 'bcrypt';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@libsql/client';
import 'node:url';
import '@iconify/utils';
import 'consola';

const verifyAdmin_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { branch_id, password } = body;
  if (!branch_id || !password) {
    throw createError({ statusCode: 400, statusMessage: "Missing fields" });
  }
  const branchResult = await db.execute({
    sql: "SELECT * FROM branches WHERE id = ?",
    args: [branch_id]
  });
  const branch = branchResult.rows[0];
  if (!branch) {
    throw createError({ statusCode: 404, statusMessage: "Branch not found" });
  }
  const adminBranchId = branch.created_by_branch || branch.id;
  const adminResult = await db.execute({
    sql: `SELECT * FROM users WHERE branch_id = ? AND role = 'admin'`,
    args: [adminBranchId]
  });
  const admin = adminResult.rows[0];
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
