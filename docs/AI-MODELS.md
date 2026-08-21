# AI Models — Maison Atelier

Documentation for open-source / self-hosted models used or planned for the AI jewelry pipeline.

**Rule:** Core MVP must not require paid SaaS APIs (OpenAI, Meshy, Tripo, Replicate, Stability, etc.).

---

## Pipeline

```
Customer request
  → Prompt builder (Next.js)
  → Concept image (optional local image model)
  → Image-to-3D (Hunyuan3D-2 local service)
  → GLB
  → Three.js viewer
```

---

## Hunyuan3D-2 (primary 3D)

| Field | Detail |
|-------|--------|
| **Model** | Hunyuan3D-2 |
| **Repository** | https://github.com/Tencent-Hunyuan/Hunyuan3D-2 |
| **License** | Check the repository `LICENSE` file before commercial production use. Hunyuan projects often use community / research licenses with conditions — **verify commercial terms for your jurisdiction and use case**. |
| **Commercial-use notes** | Do not assume “open source” equals unrestricted commercial jewelry sales. Review Tencent’s published license and attribution requirements before go-live. |
| **Role** | Image/text-to-3D mesh (GLB) via a **separate Python HTTP service** (`ai-service/`). Weights are **not** bundled in the Next.js app. |
| **Hardware** | Significant **NVIDIA GPU** VRAM recommended (often 16GB+ depending on variant/settings). CPU-only is typically impractical for quality results. |
| **OS** | Linux / **WSL2** recommended on Windows. Native Windows may be difficult; prefer WSL2 or a Linux workstation. |
| **Integration** | `AI3D_PROVIDER=hunyuan` + `AI3D_API_URL=http://localhost:8080` → `Hunyuan3DProvider` |

### Installation (high level)

1. Follow upstream Hunyuan3D-2 README for environment, CUDA, and weights download.
2. Run the Maison Atelier `ai-service/` wrapper (FastAPI) which calls the local Hunyuan stack.
3. Point Next.js `AI3D_API_URL` at that service.
4. Never commit model weights or API secrets.

---

## Mock 3D (development)

| Field | Detail |
|-------|--------|
| **Model** | N/A — `Mock3DProvider` |
| **License** | N/A (app code) |
| **Role** | Returns a **real GLB URL** from `/models/ai-mock/` after a short async delay so UI/polling/Three.js can be developed **without GPU**. |
| **Honesty** | UI must not claim mock output is Hunyuan-generated. |

---

## Freepik (optional concept images)

If you have a Freepik subscription / API access:

1. Create an API key in your Freepik developer dashboard (you do this yourself).
2. Set in Vercel / `.env`:
   ```
   IMAGE_PROVIDER=freepik
   FREEPIK_API_KEY=your_key_here
   ```
3. Redeploy.

We never log into Freepik or Pinterest for you. Pinterest is not supported as an automated source (ToS / scraping). Prefer uploading your own reference image on the create form, or Freepik API.

Respect Freepik license terms for any commercial jewelry use.


---

## Future providers (not integrated yet)

| Model | Notes |
|-------|--------|
| TRELLIS / TRELLIS.2 | Candidate high-quality mesh providers — same `AI3DProvider` interface |
| Stable Fast 3D | Future adapter |
| SPAR3D | Future adapter |

Add a provider class under `lib/ai/providers/` and register it in `lib/ai/adapter.ts`.

---

## Hardware warning

AI 3D generation is **GPU-heavy**. A typical laptop without a suitable discrete GPU will not produce high-quality meshes quickly (or at all). Use `AI3D_PROVIDER=mock` for UI development when hardware is insufficient.

---

## Visualization disclaimer (product)

All AI meshes are **visualizations**, not manufacturing-ready CAD:

> AI-generated visualization. Final dimensions, materials and manufacturing specifications require confirmation by our jewelry specialists.
