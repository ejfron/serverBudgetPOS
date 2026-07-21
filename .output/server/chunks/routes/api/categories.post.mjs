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

const categories_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, business_type } = body;
  if (!name || !name.trim()) throw createError({ statusCode: 400, statusMessage: "Category name required" });
  const trimmed = name.trim();
  const bt = business_type || "tapsilogan";
  const existing = db.prepare("SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND business_type = ?").get(trimmed, bt);
  if (existing) return existing;
  const id = randomUUID();
  db.prepare("INSERT INTO categories (id, name, business_type) VALUES (?, ?, ?)").run(id, trimmed, bt);
  return { id, name: trimmed, business_type: bt };
});

export { categories_post as default };
//# sourceMappingURL=categories.post.mjs.map
