import { d as defineEventHandler, r as readBody, c as createError, a as db } from '../../nitro/nitro.mjs';
import { randomUUID } from 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'better-sqlite3';
import 'path';
import 'fs';
import 'url';
import 'node:url';
import '@iconify/utils';
import 'consola';

const index_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, category, price } = body;
  if (!name || price == null) throw createError({ statusCode: 400, statusMessage: "Name and price required" });
  const id = randomUUID();
  db.prepare("INSERT INTO menu_items (id, name, category, price, is_available) VALUES (?, ?, ?, ?, 1)").run(id, name, category, Number(price));
  return { success: true, data: { id, name, category, price: Number(price) } };
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
