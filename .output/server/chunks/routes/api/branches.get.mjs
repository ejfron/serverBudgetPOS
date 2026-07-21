import { d as defineEventHandler, a as db } from '../../nitro/nitro.mjs';
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

const branches_get = defineEventHandler(() => {
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
  `).all();
  return branches;
});

export { branches_get as default };
//# sourceMappingURL=branches.get.mjs.map
