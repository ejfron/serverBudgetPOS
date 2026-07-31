import { d as defineEventHandler, e as getRouterParam, r as readBody, a as db, c as createError } from '../../../nitro/nitro.mjs';
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

const index_patch = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  if (body.is_available !== void 0 || body.stock_status !== void 0) {
    db.exec('ALTER TABLE menu_items ADD COLUMN stock_status TEXT DEFAULT "available"');
    const isAvail = body.is_available === true || body.is_available === 1 ? 1 : 0;
    const stock = body.stock_status || "available";
    db.prepare("UPDATE menu_items SET is_available = ?, stock_status = ? WHERE id = ?").run(isAvail, stock, id);
    return { success: true };
  }
  if (body.name) {
    db.prepare("UPDATE menu_items SET name = ?, category = ?, price = ? WHERE id = ?").run(
      body.name,
      body.category,
      Number(body.price),
      id
    );
    return { success: true };
  }
  throw createError({ statusCode: 400, statusMessage: "Invalid request" });
});

export { index_patch as default };
//# sourceMappingURL=index.patch.mjs.map
