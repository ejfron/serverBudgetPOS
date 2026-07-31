import { d as defineEventHandler, e as getRouterParam, a as db } from '../../../nitro/nitro.mjs';
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

const index_delete = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  db.prepare("DELETE FROM order_items WHERE order_id = ?").run(id);
  db.prepare("DELETE FROM orders WHERE id = ?").run(id);
  return { success: true };
});

export { index_delete as default };
//# sourceMappingURL=index.delete.mjs.map
