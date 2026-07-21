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

const debugDb_get = defineEventHandler(async () => {
  const users = db.prepare("SELECT id, username, role FROM users").all();
  const branches = db.prepare("SELECT id, name FROM branches").all();
  const settings = db.prepare("SELECT * FROM settings").all();
  return { users, branches, settings };
});

export { debugDb_get as default };
//# sourceMappingURL=debug-db.get.mjs.map
