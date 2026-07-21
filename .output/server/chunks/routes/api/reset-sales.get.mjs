import { d as defineEventHandler, a as db } from '../../nitro/nitro.mjs';
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

const resetSales_get = defineEventHandler(() => {
  db.prepare("DELETE FROM orders").run();
  return { message: "All sales data has been reset successfully." };
});

export { resetSales_get as default };
//# sourceMappingURL=reset-sales.get.mjs.map
