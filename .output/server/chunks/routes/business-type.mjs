import { Router } from 'express';
import { i as isValidBusinessType, a as db } from '../nitro/nitro.mjs';
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
router.post("/", (req, res) => {
  const { branch_id, business_type } = req.body;
  if (!branch_id || !business_type) {
    return res.status(400).json({ success: false, message: "branch_id and business_type are required" });
  }
  if (!isValidBusinessType(business_type)) {
    return res.status(400).json({ success: false, message: "Invalid business type" });
  }
  const branch = db.prepare("SELECT id FROM branches WHERE id = ?").get(branch_id);
  if (!branch) {
    return res.status(404).json({ success: false, message: "Branch not found" });
  }
  db.prepare("UPDATE branches SET business_type = ? WHERE id = ?").run(business_type, branch_id);
  return res.json({ success: true, business_type });
});

export { router as default };
//# sourceMappingURL=business-type.mjs.map
