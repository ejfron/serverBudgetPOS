import { d as defineEventHandler, e as getRouterParam, r as readBody, c as createError, a as db } from '../../../../nitro/nitro.mjs';
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

const availability_patch = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { is_available, stock_status } = body;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing item ID" });
  }
  try {
    try {
      db.exec('ALTER TABLE menu_items ADD COLUMN stock_status TEXT DEFAULT "available"');
    } catch {
    }
    db.prepare(`
      UPDATE menu_items 
      SET is_available = ?, stock_status = ?
      WHERE id = ?
    `).run(
      is_available ? 1 : 0,
      stock_status || (is_available ? "available" : "out_of_stock"),
      id
    );
    const updated = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(id);
    return {
      success: true,
      data: {
        ...updated,
        is_available: !!(updated == null ? void 0 : updated.is_available)
      }
    };
  } catch (error) {
    console.error("Error updating availability:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to update availability"
    });
  }
});

export { availability_patch as default };
//# sourceMappingURL=availability.patch.mjs.map
