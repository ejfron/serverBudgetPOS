import { d as defineEventHandler, b as getRouterParam, r as readBody, a as db } from '../../../nitro/nitro.mjs';
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

const index_patch = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { name, category, price } = body;
  db.prepare("UPDATE menu_items SET name = ?, category = ?, price = ? WHERE id = ?").run(name, category, price, id);
  return { success: true };
});

export { index_patch as default };
//# sourceMappingURL=index.patch.mjs.map
