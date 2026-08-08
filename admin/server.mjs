// Panel de administración standalone para cargar productos a mano.
// Corre SOLO en tu máquina (npm run admin) — no tiene login, no lo expongas a internet.
// Lee y escribe la misma base SQLite que usa el sitio Astro al momento del build.
import express from "express";
import multer from "multer";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import {
  getAllProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../src/lib/db.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const productsDir = join(__dirname, "..", "public", "products");
if (!existsSync(productsDir)) mkdirSync(productsDir, { recursive: true });

const PORT = process.env.PORT || 4322;

const upload = multer({
  storage: multer.diskStorage({
    destination: productsDir,
    filename: (_req, file, cb) => {
      const safeExt = extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "");
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("El archivo debe ser una imagen."));
  },
});

const app = express();
app.use(express.urlencoded({ extended: true }));

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function layout(title, body) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} · Admin catálogo</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; margin: 0; background: #f8fafc; color: #111827; }
  header { background: #4f46e5; color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
  header a { color: white; text-decoration: none; font-weight: 600; }
  main { max-width: 960px; margin: 0 auto; padding: 1.5rem; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
  th, td { text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; vertical-align: middle; }
  th { background: #f1f5f9; font-weight: 600; color: #475569; }
  img.thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; background: #e5e7eb; }
  .btn { display: inline-block; padding: 0.5rem 1rem; border-radius: 8px; background: #4f46e5; color: white; text-decoration: none; font-size: 0.9rem; font-weight: 500; border: none; cursor: pointer; }
  .btn.secondary { background: #e5e7eb; color: #111827; }
  .btn.danger { background: #dc2626; }
  .btn.small { padding: 0.35rem 0.7rem; font-size: 0.8rem; }
  .actions { display: flex; gap: 0.5rem; }
  form.card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); max-width: 480px; }
  label { display: block; font-size: 0.85rem; font-weight: 600; margin: 1rem 0 0.35rem; color: #374151; }
  label:first-child { margin-top: 0; }
  input, textarea { width: 100%; padding: 0.55rem 0.7rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; font-family: inherit; }
  textarea { resize: vertical; min-height: 70px; }
  .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .empty { text-align: center; color: #6b7280; padding: 3rem 0; }
  .hint { font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem; }
  .current-img { margin-top: 0.5rem; }
</style>
</head>
<body>
<header>
  <a href="/">Admin catálogo</a>
  <span>Corriendo en localhost:${PORT}</span>
</header>
<main>${body}</main>
</body>
</html>`;
}

app.get("/", (_req, res) => {
  const products = getAllProducts();
  const rows = products
    .map(
      (p) => `
    <tr>
      <td>${p.image ? `<img class="thumb" src="${escapeHtml(p.image)}" alt="">` : `<div class="thumb"></div>`}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${p.price != null ? "$" + Number(p.price).toLocaleString("es-AR") : "—"}</td>
      <td class="actions">
        <a class="btn secondary small" href="/products/${p.id}/edit">Editar</a>
        <form method="post" action="/products/${p.id}/delete" onsubmit="return confirm('¿Eliminar ${escapeHtml(p.name).replace(/'/g, "\\'")}? Esta acción no se puede deshacer.')">
          <button class="btn danger small" type="submit">Eliminar</button>
        </form>
      </td>
    </tr>`
    )
    .join("");

  const body = `
    <div class="top-bar">
      <h1>Productos (${products.length})</h1>
      <a class="btn" href="/new">+ Agregar producto</a>
    </div>
    ${
      products.length
        ? `<table>
      <thead><tr><th></th><th>Nombre</th><th>Categoría</th><th>Precio</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
        : `<p class="empty">Todavía no hay productos. <a href="/new">Agregá el primero</a>.</p>`
    }
  `;
  res.send(layout("Productos", body));
});

function productForm({ action, product, categories }) {
  const categoryOptions = categories.map((c) => `<option value="${escapeHtml(c)}">`).join("");
  return `
    <h1>${product ? "Editar producto" : "Nuevo producto"}</h1>
    <form class="card" method="post" action="${action}" enctype="multipart/form-data">
      <label for="name">Nombre</label>
      <input id="name" name="name" required value="${escapeHtml(product?.name ?? "")}" />

      <label for="category">Categoría</label>
      <input id="category" name="category" required list="categories" value="${escapeHtml(product?.category ?? "")}" />
      <datalist id="categories">${categoryOptions}</datalist>

      <label for="price">Precio (ARS, opcional)</label>
      <input id="price" name="price" type="number" min="0" step="1" value="${product?.price ?? ""}" />

      <label for="description">Descripción (opcional)</label>
      <textarea id="description" name="description">${escapeHtml(product?.description ?? "")}</textarea>

      <label for="image">Foto (opcional)</label>
      <input id="image" name="image" type="file" accept="image/*" />
      ${product?.image ? `<div class="current-img"><img class="thumb" src="${escapeHtml(product.image)}" alt=""> <span class="hint">Foto actual — subí una nueva para reemplazarla.</span></div>` : ""}

      <div class="top-bar" style="margin-top:1.5rem;">
        <a class="btn secondary" href="/">Cancelar</a>
        <button class="btn" type="submit">Guardar</button>
      </div>
    </form>
  `;
}

app.get("/new", (_req, res) => {
  res.send(layout("Nuevo producto", productForm({ action: "/products", product: null, categories: getCategories() })));
});

app.get("/products/:id/edit", (req, res) => {
  const product = getProductById(Number(req.params.id));
  if (!product) return res.status(404).send(layout("No encontrado", `<p class="empty">Producto no encontrado. <a href="/">Volver</a></p>`));
  res.send(layout("Editar producto", productForm({ action: `/products/${product.id}`, product, categories: getCategories() })));
});

app.post("/products", upload.single("image"), (req, res) => {
  const { name, category, price, description } = req.body;
  createProduct({
    name,
    category,
    price: price ? Number(price) : null,
    description,
    image: req.file ? `/products/${req.file.filename}` : null,
  });
  res.redirect("/");
});

app.post("/products/:id", upload.single("image"), (req, res) => {
  const { name, category, price, description } = req.body;
  updateProduct(Number(req.params.id), {
    name,
    category,
    price: price ? Number(price) : null,
    description,
    image: req.file ? `/products/${req.file.filename}` : undefined,
  });
  res.redirect("/");
});

app.post("/products/:id/delete", (req, res) => {
  deleteProduct(Number(req.params.id));
  res.redirect("/");
});

app.use((err, _req, res, _next) => {
  res.status(400).send(layout("Error", `<p class="empty">${escapeHtml(err.message)}</p><p><a href="/">Volver</a></p>`));
});

app.listen(PORT, () => {
  console.log(`Admin del catálogo corriendo en http://localhost:${PORT}`);
});
