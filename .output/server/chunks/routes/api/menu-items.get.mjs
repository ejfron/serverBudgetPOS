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

const menuItems_get = defineEventHandler(() => {
  const items = db.prepare(`
    SELECT id, name, category, price, is_available, created_at
    FROM menu_items
    WHERE is_available = 1
    ORDER BY category, name
  `).all();
  return { success: true, data: items };
});

export { menuItems_get as default };
//# sourceMappingURL=menu-items.get.mjs.map
