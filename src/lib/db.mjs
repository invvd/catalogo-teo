// Capa de datos compartida entre el sitio Astro (lectura, en build) y el
// admin standalone (admin/server.mjs, lectura + escritura). Usa el módulo
// nativo node:sqlite (sin dependencias externas).
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "..", "data");
const dbPath = join(dataDir, "catalog.db");

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER,
    description TEXT,
    image TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const SEED_PRODUCTS = [
  { name: "Conjunto de training hombre", category: "Hombre", price: 24999, description: "Buzo y pantalón deportivo, tela liviana." },
  { name: "Remera dry-fit hombre", category: "Hombre", price: 8999, description: null },
  { name: "Short de training", category: "Hombre", price: 7499, description: null },
  { name: "Legging deportivo mujer", category: "Mujer", price: 11999, description: null },
  { name: "Top deportivo mujer", category: "Mujer", price: 6999, description: null },
  { name: "Campera rompeviento mujer", category: "Mujer", price: 21999, description: null },
  { name: "Conjunto deportivo niño", category: "Niños", price: 13999, description: null },
  { name: "Remera deportiva niño", category: "Niños", price: 5999, description: null },
  { name: "Medias deportivas (pack x3)", category: "Accesorios", price: 3999, description: null },
  { name: "Gorra deportiva", category: "Accesorios", price: 5499, description: null },
  { name: "Mochila deportiva", category: "Accesorios", price: 15999, description: null },
  { name: "Bolso de gimnasio", category: "Accesorios", price: 9999, description: null },
];

const { count } = db.prepare("SELECT COUNT(*) AS count FROM products").get();
if (count === 0) {
  const insert = db.prepare(
    "INSERT INTO products (name, category, price, description, image) VALUES (?, ?, ?, ?, NULL)"
  );
  for (const p of SEED_PRODUCTS) {
    insert.run(p.name, p.category, p.price, p.description);
  }
}

export function getAllProducts() {
  return db.prepare("SELECT * FROM products ORDER BY created_at DESC, id DESC").all();
}

export function getCategories() {
  const rows = db.prepare("SELECT DISTINCT category FROM products ORDER BY category ASC").all();
  return rows.map((r) => r.category);
}

export function getProductById(id) {
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id) ?? null;
}

export function createProduct({ name, category, price, description, image }) {
  const result = db
    .prepare(
      "INSERT INTO products (name, category, price, description, image) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name, category, price, description || null, image || null);
  return getProductById(Number(result.lastInsertRowid));
}

export function updateProduct(id, { name, category, price, description, image }) {
  const current = getProductById(id);
  if (!current) return null;
  db.prepare(
    "UPDATE products SET name = ?, category = ?, price = ?, description = ?, image = ? WHERE id = ?"
  ).run(
    name,
    category,
    price,
    description || null,
    image ?? current.image,
    id
  );
  return getProductById(id);
}

export function deleteProduct(id) {
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
}
