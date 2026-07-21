import { d as defineEventHandler, r as readBody, c as createError, a as db, i as isValidBusinessType, h as hasKitchen } from '../../nitro/nitro.mjs';
import { v4 } from 'uuid';
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

const branches_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { branches } = body;
  if (!Array.isArray(branches) || branches.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "At least one branch is required" });
  }
  const insertBranch = db.prepare("INSERT INTO branches (id, name, address, business_type) VALUES (?, ?, ?, ?)");
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction(() => {
    for (const b of branches) {
      if (!isValidBusinessType(b.business_type)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid or missing business_type for branch "${b.name || "(unnamed)"}"` });
      }
      const branchNeedsKitchen = hasKitchen(b.business_type);
      if (!b.name || !b.cashierUsername || !b.cashierPassword) {
        throw createError({ statusCode: 400, statusMessage: "Branch name, cashier username, and cashier password are required" });
      }
      if (branchNeedsKitchen && (!b.kitchenUsername || !b.kitchenPassword)) {
        throw createError({ statusCode: 400, statusMessage: `Kitchen username and password are required for ${b.business_type} branches` });
      }
      const branchId = v4();
      insertBranch.run(branchId, b.name, b.location || "", b.business_type);
      const cashierId = v4();
      const cashierHash = bcrypt.hashSync(b.cashierPassword, 10);
      insertUser.run(cashierId, b.cashierUsername, cashierHash, "front", branchId, b.cashierUsername);
      if (branchNeedsKitchen) {
        const kitchenId = v4();
        const kitchenHash = bcrypt.hashSync(b.kitchenPassword, 10);
        insertUser.run(kitchenId, b.kitchenUsername, kitchenHash, "kitchen", branchId, b.kitchenUsername);
      }
    }
  });
  transaction();
  return { success: true };
});

export { branches_post as default };
//# sourceMappingURL=branches.post.mjs.map
