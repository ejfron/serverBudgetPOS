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

const settings_get = defineEventHandler(() => {
  const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  return settings != null ? settings : { business_name: "My Business" };
});

export { settings_get as default };
//# sourceMappingURL=settings.get.mjs.map
