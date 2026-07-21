import { d as defineEventHandler, r as readBody, c as createError, a as db } from '../../nitro/nitro.mjs';
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

const orders_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { branch_id, created_by, items, payment_method } = body;
  if (!branch_id || !created_by || !Array.isArray(items) || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Missing required fields" });
  }
  const total_amount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const lastOrder = db.prepare(`
    SELECT MAX(order_number) as maxNum FROM orders WHERE branch_id = ?
  `).get(branch_id);
  const order_number = ((lastOrder == null ? void 0 : lastOrder.maxNum) || 0) + 1;
  const orderId = v4();
  const pm = payment_method || "cash";
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, branch_id, order_number, created_by, total_amount, status, payment_method)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction(() => {
    insertOrder.run(orderId, branch_id, order_number, created_by, total_amount, pm);
    for (const item of items) {
      const subtotal = item.unit_price * item.quantity;
      insertItem.run(v4(), orderId, item.menu_item_id, item.name, item.quantity, item.unit_price, subtotal);
    }
  });
  transaction();
  const order = db.prepare(`
    SELECT o.*, b.name as branch_name
    FROM orders o JOIN branches b ON o.branch_id = b.id
    WHERE o.id = ?
  `).get(orderId);
  const orderItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);
  return { success: true, order: { ...order, order_items: orderItems } };
});

export { orders_post as default };
//# sourceMappingURL=orders.post.mjs.map
