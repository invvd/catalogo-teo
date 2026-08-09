# Catálogo de ropa deportiva

Sitio estático hecho con [Astro](https://astro.build) para mostrar un catálogo de
productos con filtro por categoría y botón de "Consultar por WhatsApp" en cada
card. Los productos se administran con un panel propio (SQLite + Express), no
hay CMS ni backend externo.

## Estructura

```text
src/
├── components/     Header, Footer, ProductCard, SocialIcons
├── data/config.ts  Nombre de la tienda, WhatsApp, redes sociales, developer
├── lib/db.mjs      Acceso a SQLite (leído por el sitio y por el admin)
└── pages/index.astro

admin/server.mjs    Panel de administración (alta/edición/borrado de productos)
data/catalog.db     Base SQLite (no se versiona, es tu contenido)
public/products/    Fotos de los productos
```

## Primeros pasos

```bash
npm install
npm run dev
```

Abrí `http://localhost:4321`.

Antes de publicar, completá los datos reales en [src/data/config.ts](src/data/config.ts)
(nombre de la tienda, número de WhatsApp, redes sociales, crédito del developer).

## Comandos

| Comando                  | Qué hace                                                          |
| ------------------------ | ------------------------------------------------------------------ |
| `npm run dev`             | Sitio en modo desarrollo, `localhost:4321`                        |
| `npm run build`           | Genera el sitio estático en `dist/` (lee los productos de SQLite) |
| `npm run preview`         | Sirve `dist/` localmente para revisar el build                    |
| `npm run admin`           | Panel de administración de productos, `localhost:4322`            |
| `npm run package:admin`   | Genera un `.zip` portátil del admin (con Node incluido) para compartir |

## Cargar productos

**En tu máquina:** `npm run admin` y abrís `http://localhost:4322`. Tabla con
todos los productos, alta con foto por upload, edición y borrado.

**En la máquina de otra persona sin Node instalado:** correr
`npm run package:admin` genera `catalogo-admin-portable-win.zip` (Node
embebido, no requiere instalar nada). Se lo pasás junto con las
instrucciones de uso en [scripts/LEEME-admin-portable.txt](scripts/LEEME-admin-portable.txt)
(se incluyen automáticamente dentro del zip como `LEEME.txt`). Esa persona
después te devuelve las carpetas `data/` y `public/` con lo que cargó.

⚠️ El admin **no tiene login**. Pensado para correr solo en una máquina local,
nunca lo expongas públicamente en internet tal como está.

## Publicar el sitio

El sitio es 100% estático: los datos de SQLite se "hornean" en HTML recién al
correr `npm run build`. Flujo:

1. Cargar/actualizar productos (`npm run admin`, o recibir `data/` + `public/`
   de quien los cargó).
2. `npm run build`.
3. Subir la carpeta `dist/` a Netlify, Vercel, GitHub Pages o el hosting que
   uses.

Guardá una copia de `data/catalog.db` de tanto en tanto — es la única fuente
de verdad de tu catálogo y no se versiona en git.
