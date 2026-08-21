# AI Jewelry Generator — Phase 1 & 2 Report

Date: 2026-08-21  
Project: Maison Atelier — Jewelry 3D Configurator → AI Jewelry Generator

## Phase 1 — Current architecture

### Customer flow today
Home → `/design` (category + **procedural ring form**) → `/quotation` → submit → `/submit`  
Admin: `/admin/*`, design detail `/design/[id]`

### What stays
- Admin auth (jose + bcrypt), middleware  
- Prisma PostgreSQL, design IDs, quotations, PDF, email/WhatsApp adapters  
- Admin dashboard shell  
- R3F viewer shell (will swap mesh source)  
- Pricing engine (inputs will change)  
- Storage helpers  

### What must change (later phases)
- `DesignClient`, `RingConfiguratorForm`, configurator Zustand store  
- Viewer: load **GLB** instead of torus  
- Validation / types from `RingConfig` → customer request + generations  
- `POST /api/designs` → job-aware pipeline  
- Homepage CTA → “Create Your Jewelry”  

### Database (Phase 4)
Add `GenerationJob`, `DesignVersion`; extend `Design` with request/prompt/selected version fields. Safe migration — do not wipe existing rows.

### AI service
Separate `ai-service/` (Python). Next.js never embeds Hunyuan weights.

### Dependencies
- Next: existing + no paid AI SDKs required  
- Python: FastAPI/uvicorn (see `ai-service/requirements.txt`)  
- Hunyuan3D-2: GPU + upstream install (see `docs/AI-MODELS.md`)

### Hardware
Real 3D generation needs a strong NVIDIA GPU. Use `AI3D_PROVIDER=mock` without GPU.

### Blockers
1. No GLB assets in repo yet for mock mesh load tests  
2. Hunyuan not wired (Phase 7–9)  
3. Vercel serverless cannot run Hunyuan — local/GPU worker required  
4. Large mesh storage needs durable storage beyond `/tmp`

---

## Phase 2 — Delivered

| Path | Purpose |
|------|---------|
| `lib/ai/types.ts` | `AI3DProvider`, image generator, request types, job statuses |
| `lib/ai/prompt-builder.ts` | Customer form → internal jewelry prompt |
| `lib/ai/image-generator.ts` | `MockImageGenerator` + `generateJewelryConcept()` |
| `lib/ai/providers/mock-3d.ts` | Async mock jobs + GLB URL contract |
| `lib/ai/providers/hunyuan-3d.ts` | HTTP client for local Hunyuan service |
| `lib/ai/adapter.ts` | Provider selection via `AI3D_PROVIDER` |
| `types/generation.ts` | Job/version DTOs |
| `ai-service/` | FastAPI stub, mock + hunyuan stubs, README |
| `docs/AI-MODELS.md` | Licenses, hardware, commercial notes |
| `.env.example` | `AI3D_*`, `IMAGE_*` vars |

**Not claimed:** Real Hunyuan GLB generation. Mock returns a GLB *path*; place files under `public/models/ai-mock/` before claiming Three.js loads a mesh.

---

## Next (Phase 3+)
Simple customer request form → generation job schema → wire mock GLB viewer → Hunyuan service → regenerate/versions → quotation/submit/admin updates.
