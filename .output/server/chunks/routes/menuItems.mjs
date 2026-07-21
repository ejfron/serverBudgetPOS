import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { a as db } from '../nitro/nitro.mjs';
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

const router = Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), "public/uploads")),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});
router.get("/", (_req, res) => {
  const items = db.prepare("SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, name").all();
  return res.json({ success: true, data: items });
});
router.post("/", upload.single("image"), (req, res) => {
  const { name, category, price } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ success: false, message: "Name and price required" });
  }
  try {
    const id = randomUUID();
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    db.prepare(`
      INSERT INTO menu_items (id, name, category, price, image_url, is_available)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, name, category, Number(price), imageUrl);
    return res.status(201).json({
      success: true,
      data: { id, name, category, price: Number(price), image_url: imageUrl }
    });
  } catch (err) {
    console.error("Create item error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to save item" });
  }
});
router.post("/bulk", (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "No items provided" });
  }
  try {
    const insert = db.prepare(`
      INSERT INTO menu_items (id, name, category, price, is_available)
      VALUES (?, ?, ?, ?, 1)
    `);
    const insertMany = db.transaction((rows) => {
      for (const item of rows) {
        if (!item.name || item.price == null) {
          throw new Error(`Invalid item: ${JSON.stringify(item)}`);
        }
        insert.run(randomUUID(), item.name, item.category, item.price);
      }
    });
    insertMany(items);
    return res.json({ success: true, message: `${items.length} item(s) added` });
  } catch (err) {
    console.error("Bulk insert error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to save menu items" });
  }
});
router.patch("/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, category, price } = req.body;
  try {
    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      const result = db.prepare(`
        UPDATE menu_items SET name = ?, category = ?, price = ?, image_url = ?
        WHERE id = ?
      `).run(name, category, price, imageUrl, id);
      if (result.changes === 0) return res.status(404).json({ success: false, message: "Item not found" });
    } else {
      const result = db.prepare(`
        UPDATE menu_items SET name = ?, category = ?, price = ?
        WHERE id = ?
      `).run(name, category, price, id);
      if (result.changes === 0) return res.status(404).json({ success: false, message: "Item not found" });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update item" });
  }
});
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare("UPDATE menu_items SET is_available = 0 WHERE id = ?").run(id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: "Item not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to delete item" });
  }
});

export { router as default };
//# sourceMappingURL=menuItems.mjs.map
