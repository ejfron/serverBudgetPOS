import { d as defineEventHandler, g as getQuery, c as createError, a as db } from '../../nitro/nitro.mjs';
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

const menuItems_get = defineEventHandler((event) => {
  const query = getQuery(event);
  const branchId = query.branch_id;
  if (!branchId) {
    throw createError({ statusCode: 400, statusMessage: "branch_id required" });
  }
  const items = db.prepare(`
    SELECT id, name, category, price, is_available, created_at, image_url, branch_id, wholesale_price
    FROM menu_items
    WHERE is_available = 1 AND branch_id = ?
    ORDER BY category, name
  `).all(branchId);
  return { success: true, data: items };
});

export { menuItems_get as default };
//# sourceMappingURL=menu-items.get.mjs.map
