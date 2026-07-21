import { d as defineEventHandler, e as getRouterParam, b as readFormData, a as db } from '../../../nitro/nitro.mjs';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'better-sqlite3';
import 'path';
import 'fs';
import 'url';
import 'node:url';
import '@iconify/utils';
import 'consola';

const index_patch = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const formData = await readFormData(event);
  const name = formData.get("name");
  const category = formData.get("category");
  const price = formData.get("price");
  const image = formData.get("image");
  let imageUrl = null;
  if (image && image.size > 0) {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const ext = path.extname(image.name) || ".png";
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    imageUrl = `/uploads/${filename}`;
    db.prepare("UPDATE menu_items SET name = ?, category = ?, price = ?, image_url = ? WHERE id = ?").run(name, category, Number(price), imageUrl, id);
  } else {
    db.prepare("UPDATE menu_items SET name = ?, category = ?, price = ? WHERE id = ?").run(name, category, Number(price), id);
  }
  return { success: true };
});

export { index_patch as default };
//# sourceMappingURL=index.patch.mjs.map
