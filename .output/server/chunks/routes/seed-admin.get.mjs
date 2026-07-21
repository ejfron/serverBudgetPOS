import { d as defineEventHandler } from '../nitro/nitro.mjs';
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'path';
import 'fs';
import 'url';
import 'node:url';
import '@iconify/utils';
import 'consola';

const seedAdmin_get = defineEventHandler(() => {
  const db = new Database("./database/tapsilogan.db");
  db.exec(`
    DROP TABLE IF EXISTS users
  `);
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('front', 'kitchen', 'admin')),
      branch_id INTEGER,
      full_name TEXT,
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    )
  `);
  const branch = db.prepare("SELECT id FROM branches LIMIT 1").get();
  if (!branch) {
    db.prepare("INSERT INTO branches (name) VALUES (?)").run("Main Branch");
    const newBranch = db.prepare("SELECT id FROM branches LIMIT 1").get();
    var branchId = newBranch.id;
  } else {
    var branchId = branch.id;
  }
  const password = "admin123";
  const passwordHash = bcrypt.hashSync(password, 10);
  const testVerify = bcrypt.compareSync(password, passwordHash);
  db.prepare(`
    INSERT INTO users (username, password_hash, role, branch_id, full_name)
    VALUES ('admin', ?, 'front', ?, 'Admin User')
  `).run(passwordHash, branchId);
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
  return {
    success: true,
    message: "Test user created!",
    password,
    hash: passwordHash,
    hash_verification: testVerify,
    user_created: !!user,
    user_data: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
});

export { seedAdmin_get as default };
//# sourceMappingURL=seed-admin.get.mjs.map
