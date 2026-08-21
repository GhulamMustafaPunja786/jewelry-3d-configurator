# Maison Atelier — Jewelry 3D Configurator

Production-oriented MVP for configuring rings in 3D, generating quotations (PDF), and submitting designs to an admin atelier workspace.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Three.js / React Three Fiber / Drei** — live ring preview
- **Zustand** — configurator state
- **React Hook Form + Zod** — validation
- **Prisma 5.22 + PostgreSQL** — Prisma Postgres / Neon / Supabase compatible
- **jose + bcryptjs** — admin session cookies
- **pdf-lib** — quotation PDFs

## Flow

Home → Design (pick Ring) → Form + 3D viewer → View Quotation → Customer details → Submit → Confirmation

Other jewelry categories share the same architecture and show as **Coming soon**.

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env from .env.example → .env
# DATABASE_URL must be a PostgreSQL connection string
# ADMIN_PASSWORD=...
# SESSION_SECRET=... (min 32 chars)

# 3. Database
npm run db:generate
npm run db:push
npm run db:seed

# 4. Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)  
Default seed user: `admin@jewelry.local` / password from `ADMIN_PASSWORD` (default `ChangeMeAdmin123!`).

## Production notes

- Set `DATABASE_URL`, `SESSION_SECRET`, and `NEXT_PUBLIC_APP_URL` in your host (Vercel).
- Email/WhatsApp are optional — submissions still succeed without them.
- Temporary Prisma Postgres databases should be **claimed** for permanence (see claim URL from `create-db`).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` / `start` | Production build & serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run db:generate` | Prisma client |
| `npm run db:push` | Push schema to PostgreSQL |
| `npm run db:seed` | Demo metals, stones, pricing, admin |
| `npm run db:studio` | Prisma Studio |

## 3D models

Place GLB files in:

```
public/models/rings/<slug>.glb
```

See `public/models/rings/README.md`. When a GLB is missing, the viewer uses a **procedural torus + gem** with metal/stone materials.

## Design submission API

`POST /api/designs`

1. Validates payload with Zod  
2. Generates design ID `JWL-YYYYMMDD-NNNNN`  
3. Saves customer, design, quotation items  
4. Builds PDF → `public/uploads/pdfs/`  
5. Optional preview data URL → `public/uploads/previews/`  
6. Attempts email (warns / succeeds if not configured)  
7. Returns `{ designId, emailWarning }`

## Adapters (optional)

| Area | Behavior when unset |
|------|---------------------|
| Email (`lib/email`) | No-op with warning flag |
| WhatsApp (`lib/notifications`) | Stub / log only |
| AI (`lib/ai/types`) | Interface only |

## Switching to PostgreSQL

1. Change `provider` in `prisma/schema.prisma` to `postgresql`  
2. Set `DATABASE_URL` to your Postgres/Supabase URL  
3. Run `npm run db:push` (or migrations)

## Project structure (high level)

```
app/                 # Routes + API
components/          # UI, forms, viewer, admin
data/                # Static catalog seeds for client pricing
lib/                 # Auth, pricing, PDF, storage, adapters
prisma/              # Schema + seed
public/models/rings/ # GLB placement
store/               # Zustand configurator
types/               # Shared TS types
```

## Notes

- Mobile: form above viewer; desktop: side-by-side on `/design`
- Premium cream / ink / gold palette with Cormorant Garamond + Outfit
- Do not commit `.env` — only `.env.example`
