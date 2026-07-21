import { d as defineEventHandler, r as readBody, c as createError, i as isValidBusinessType, a as db } from '../../../nitro/nitro.mjs';
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

const businessType_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { branch_id, business_type } = body;
  if (!branch_id || !business_type) {
    throw createError({ statusCode: 400, statusMessage: "branch_id and business_type are required" });
  }
  if (!isValidBusinessType(business_type)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid business type" });
  }
  const branch = db.prepare("SELECT id FROM branches WHERE id = ?").get(branch_id);
  if (!branch) {
    throw createError({ statusCode: 404, statusMessage: "Branch not found" });
  }
  db.prepare("UPDATE branches SET business_type = ? WHERE id = ?").run(business_type, branch_id);
  return { success: true, business_type };
});

export { businessType_post as default };
//# sourceMappingURL=business-type.post.mjs.map
