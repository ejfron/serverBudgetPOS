import { d as defineEventHandler, e as getRouterParam, a as db } from '../../../nitro/nitro.mjs';
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

const index_delete = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  db.prepare("UPDATE menu_items SET is_available = 0 WHERE id = ?").run(id);
  return { success: true };
});

export { index_delete as default };
//# sourceMappingURL=index.delete.mjs.map
