import { Router } from 'express';
import { v4 } from 'uuid';
import { a as db } from '../nitro/nitro.mjs';
import { WebSocket } from 'ws';
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

const clients = /* @__PURE__ */ new Map();
function broadcast(branchId, payload) {
  const branchClients = clients.get(branchId);
  if (!branchClients) return;
  const message = JSON.stringify(payload);
  for (const client of branchClients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

const router = Router();
router.get("/", (req, res) => {
  const { branch_id, status } = req.query;
  if (!branch_id) return res.status(400).json({ success: false, message: "branch_id required" });
  let query = `SELECT o.*, json_group_array(json_object('id', oi.id, 'order_id', oi.order_id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)) as order_items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.branch_id = ?`;
  const params = [branch_id];
  if (status) {
    query += ` AND o.status = ?`;
    params.push(status);
  }
  query += ` GROUP BY o.id ORDER BY o.created_at ASC`;
  const orders = db.prepare(query).all(...params);
  const parsed = orders.map((o) => ({ ...o, order_items: JSON.parse(o.order_items).filter((i) => i.id !== null) }));
  return res.json({ success: true, data: parsed });
});
router.post("/", (req, res) => {
  var _a;
  const { branch_id, created_by, cart, items, payment_method } = req.body;
  const orderItems = Array.isArray(cart) ? cart : Array.isArray(items) ? items : [];
  if (!branch_id || !created_by || !(orderItems == null ? void 0 : orderItems.length)) return res.status(400).json({ success: false, message: "Missing fields" });
  const total = orderItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const last = db.prepare("SELECT MAX(order_number) as last FROM orders WHERE branch_id = ?").get(branch_id);
  const orderNumber = ((_a = last.last) != null ? _a : 0) + 1;
  const orderId = v4();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.transaction(() => {
    db.prepare("INSERT INTO orders (id, branch_id, status, order_number, created_by, total_amount, created_at, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(orderId, branch_id, "pending", orderNumber, created_by, total, now, payment_method || "cash");
    for (const item of orderItems) {
      db.prepare("INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)").run(v4(), orderId, item.menu_item_id, item.name, item.quantity, item.unit_price, item.unit_price * item.quantity);
    }
  })();
  const full = db.prepare(`SELECT o.*, json_group_array(json_object('id', oi.id, 'order_id', oi.order_id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)) as order_items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.id = ? GROUP BY o.id`).get(orderId);
  const result = { ...full, order_items: JSON.parse(full.order_items).filter((i) => i.id !== null) };
  broadcast(branch_id, { type: "ORDER_CREATED", order: result });
  return res.status(201).json({ success: true, data: result });
});
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { status, payment_method, order_items, total_amount } = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (status) {
    if (status === "ready") {
      db.prepare(`UPDATE orders SET status = 'ready', ready_at = ? WHERE id = ?`).run(now, id);
    } else if (status === "completed") {
      db.prepare(`UPDATE orders SET status = 'completed', completed_at = ? WHERE id = ?`).run(now, id);
    } else if (status === "voided" || status === "ongoing" || status === "pending") {
      db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id);
    }
  }
  if (order_items && total_amount) {
    db.prepare("DELETE FROM order_items WHERE order_id = ?").run(id);
    for (const item of order_items) {
      db.prepare("INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)").run(v4(), id, item.menu_item_id || null, item.item_name, item.quantity, item.unit_price, item.subtotal || item.quantity * item.unit_price);
    }
    if (payment_method) {
      db.prepare("UPDATE orders SET total_amount = ?, payment_method = ? WHERE id = ?").run(total_amount, payment_method, id);
    } else {
      db.prepare("UPDATE orders SET total_amount = ? WHERE id = ?").run(total_amount, id);
    }
  }
  if (payment_method && !order_items) {
    db.prepare("UPDATE orders SET payment_method = ? WHERE id = ?").run(payment_method, id);
  }
  const updated = db.prepare(`SELECT o.*, json_group_array(json_object('id', oi.id, 'order_id', oi.order_id, 'menu_item_id', oi.menu_item_id, 'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)) as order_items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.id = ? GROUP BY o.id`).get(id);
  const result = { ...updated, order_items: JSON.parse(updated.order_items).filter((i) => i.id !== null) };
  broadcast(result.branch_id, { type: "ORDER_UPDATED", order: result });
  return res.json({ success: true, data: result });
});
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.transaction(() => {
    db.prepare("DELETE FROM order_items WHERE order_id = ?").run(id);
    db.prepare("DELETE FROM orders WHERE id = ?").run(id);
  })();
  return res.json({ success: true, message: "Order deleted" });
});

export { router as default };
//# sourceMappingURL=orders.mjs.map
