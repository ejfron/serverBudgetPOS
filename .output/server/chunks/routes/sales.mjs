import { Router } from 'express';
import { a as db } from '../nitro/nitro.mjs';
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

const router = Router();
router.get("/stats", (req, res) => {
  var _a, _b;
  const branchId = req.query.branch_id;
  const row = branchId ? db.prepare(`
        SELECT
          COALESCE(SUM(total_amount), 0) as totalRevenue,
          COUNT(*) as orderCount
        FROM orders
        WHERE status = 'completed' AND branch_id = ?
      `).get(branchId) : db.prepare(`
        SELECT
          COALESCE(SUM(total_amount), 0) as totalRevenue,
          COUNT(*) as orderCount
        FROM orders
        WHERE status = 'completed'
      `).get();
  const orderCount = Number((_a = row == null ? void 0 : row.orderCount) != null ? _a : 0);
  const totalRevenue = Number((_b = row == null ? void 0 : row.totalRevenue) != null ? _b : 0);
  return res.json({
    totalRevenue,
    orderCount,
    averageOrder: orderCount > 0 ? totalRevenue / orderCount : 0
  });
});

export { router as default };
//# sourceMappingURL=sales.mjs.map
