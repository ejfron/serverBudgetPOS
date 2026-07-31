import { d as defineEventHandler, r as readBody, c as createError, a as db, i as isValidBusinessType, h as hasKitchen } from '../../nitro/nitro.mjs';
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

const branches_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { branches, admin_branch_id } = body;
  if (!Array.isArray(branches) || branches.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "At least one branch is required" });
  }
  db.exec("BEGIN");
  try {
    for (const b of branches) {
      if (!isValidBusinessType(b.business_type)) {
        throw new Error(`Invalid or missing business_type for branch "${b.name || "(unnamed)"}"`);
      }
      const branchNeedsKitchen = hasKitchen(b.business_type);
      if (!b.name || !b.cashierUsername || !b.cashierPassword) {
        throw new Error("Branch name, cashier username, and cashier password are required");
      }
      if (branchNeedsKitchen && (!b.kitchenUsername || !b.kitchenPassword)) {
        throw new Error(`Kitchen username and password are required for ${b.business_type} branches`);
      }
      const branchId = randomUUID();
      db.prepare(`
        INSERT INTO branches (id, name, address, business_type, created_by_branch)
        VALUES (?, ?, ?, ?, ?)
      `).run(branchId, b.name, b.location || null, b.business_type, admin_branch_id || null);
      let cashierUsername = b.cashierUsername;
      let counter = 1;
      while (db.prepare("SELECT id FROM users WHERE username = ?").get(cashierUsername)) {
        cashierUsername = `${b.cashierUsername}${counter}`;
        counter++;
      }
      const cashierHash = bcrypt.hashSync(b.cashierPassword, 10);
      db.prepare(`
        INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
        VALUES (?, ?, ?, 'front', ?, ?)
      `).run(randomUUID(), cashierUsername, cashierHash, branchId, b.name);
      if (branchNeedsKitchen) {
        let kitchenUsername = b.kitchenUsername;
        let kCounter = 1;
        while (db.prepare("SELECT id FROM users WHERE username = ?").get(kitchenUsername)) {
          kitchenUsername = `${b.kitchenUsername}${kCounter}`;
          kCounter++;
        }
        const kitchenHash = bcrypt.hashSync(b.kitchenPassword, 10);
        db.prepare(`
          INSERT INTO users (id, username, password_hash, role, branch_id, full_name)
          VALUES (?, ?, ?, 'kitchen', ?, ?)
        `).run(randomUUID(), kitchenUsername, kitchenHash, branchId, b.name);
      }
    }
    db.exec("COMMIT");
    return { success: true };
  } catch (err) {
    db.exec("ROLLBACK");
    console.error("Create branches error:", err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || "Failed to create branches"
    });
  }
});

export { branches_post as default };
//# sourceMappingURL=branches.post.mjs.map
