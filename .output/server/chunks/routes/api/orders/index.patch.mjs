import { d as defineEventHandler, e as getRouterParam, r as readBody, a as db } from '../../../nitro/nitro.mjs';
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

const index_patch = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { status, payment_method, order_items, total_amount } = body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (status) {
    if (status === "ready") db.prepare(`UPDATE orders SET status = 'ready', ready_at = ? WHERE id = ?`).run(now, id);
    else if (status === "completed") db.prepare(`UPDATE orders SET status = 'completed', completed_at = ? WHERE id = ?`).run(now, id);
    else db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id);
  }
  if (order_items && total_amount) {
    db.prepare("DELETE FROM order_items WHERE order_id = ?").run(id);
    for (const item of order_items) db.prepare("INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)").run(randomUUID(), id, item.menu_item_id || null, item.item_name, item.quantity, item.unit_price, item.subtotal || item.quantity * item.unit_price);
    payment_method ? db.prepare("UPDATE orders SET total_amount = ?, payment_method = ? WHERE id = ?").run(total_amount, payment_method, id) : db.prepare("UPDATE orders SET total_amount = ? WHERE id = ?").run(total_amount, id);
  }
  if (payment_method && !order_items) db.prepare("UPDATE orders SET payment_method = ? WHERE id = ?").run(payment_method, id);
  return { success: true };
});

export { index_patch as default };
//# sourceMappingURL=index.patch.mjs.map
