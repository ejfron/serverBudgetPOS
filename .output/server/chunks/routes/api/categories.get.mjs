import { d as defineEventHandler, g as getQuery, a as db } from '../../nitro/nitro.mjs';
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

const categories_get = defineEventHandler((event) => {
  const query = getQuery(event);
  const business_type = query.business_type;
  let sql = "SELECT * FROM categories";
  const params = [];
  if (business_type && business_type !== "undefined") {
    sql += " WHERE business_type = ?";
    params.push(business_type);
  }
  sql += " ORDER BY name";
  return db.prepare(sql).all(...params);
});

export { categories_get as default };
//# sourceMappingURL=categories.get.mjs.map
