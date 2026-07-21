import { d as defineEventHandler, b as readFormData, c as createError, a as db } from '../../nitro/nitro.mjs';
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

const menuItems_post = defineEventHandler(async (event) => {
  const formData = await readFormData(event);
  const name = formData.get("name");
  const category = formData.get("category");
  const price = formData.get("price");
  const image = formData.get("image");
  if (!name || !price) {
    throw createError({ statusCode: 400, statusMessage: "Name and price required" });
  }
  let imageUrl = null;
  if (image && image.size > 0) {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const ext = path.extname(image.name) || ".png";
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    imageUrl = `/uploads/${filename}`;
  }
  const id = randomUUID();
  db.prepare("INSERT INTO menu_items (id, name, category, price, image_url, is_available) VALUES (?, ?, ?, ?, ?, 1)").run(id, name, category || "silog", Number(price), imageUrl);
  return {
    success: true,
    data: { id, name, category: category || "silog", price: Number(price), image_url: imageUrl }
  };
});

export { menuItems_post as default };
//# sourceMappingURL=menu-items.post.mjs.map
