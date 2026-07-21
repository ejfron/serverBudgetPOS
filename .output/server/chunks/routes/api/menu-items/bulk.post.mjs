import { d as defineEventHandler, r as readBody, c as createError, a as db } from '../../../nitro/nitro.mjs';
import { v4 } from 'uuid';
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

const bulk_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { items } = body;
  if (!Array.isArray(items) || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "At least one item is required" });
  }
  const insert = db.prepare(`
    INSERT INTO menu_items (id, name, category, price, is_available)
    VALUES (?, ?, ?, ?, 1)
  `);
  const transaction = db.transaction(() => {
    for (const item of items) {
      if (!item.name || !item.category || item.price == null) {
        throw createError({ statusCode: 400, statusMessage: "Each item must have name, category, and price" });
      }
      insert.run(v4(), item.name, item.category, item.price);
    }
  });
  transaction();
  return { success: true };
});

export { bulk_post as default };
//# sourceMappingURL=bulk.post.mjs.map
