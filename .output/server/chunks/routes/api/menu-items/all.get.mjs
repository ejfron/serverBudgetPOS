import { d as defineEventHandler, g as getQuery, c as createError, a as db } from '../../../nitro/nitro.mjs';
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

const all_get = defineEventHandler((event) => {
  const { branch_id, business_type } = getQuery(event);
  if (!branch_id) {
    throw createError({ statusCode: 400, statusMessage: "branch_id required" });
  }
  let query = "SELECT * FROM menu_items WHERE branch_id = ?";
  const params = [branch_id];
  if (business_type) {
    query += " AND business_type = ?";
    params.push(business_type);
  }
  query += " ORDER BY category, name";
  const items = db.prepare(query).all(...params);
  return {
    success: true,
    data: items.map((i) => ({ ...i, is_available: !!i.is_available }))
  };
});

export { all_get as default };
//# sourceMappingURL=all.get.mjs.map
