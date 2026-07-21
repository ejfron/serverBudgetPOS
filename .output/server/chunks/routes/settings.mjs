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
router.get("/", (_req, res) => {
  const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  return res.json(settings != null ? settings : { business_name: "My Business" });
});

export { router as default };
//# sourceMappingURL=settings.mjs.map
