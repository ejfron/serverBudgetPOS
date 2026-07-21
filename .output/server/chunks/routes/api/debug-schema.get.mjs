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

const debugSchema_get = defineEventHandler(() => {
  const columns = db.prepare("PRAGMA table_info(orders)").all();
  return columns;
});

export { debugSchema_get as default };
//# sourceMappingURL=debug-schema.get.mjs.map
