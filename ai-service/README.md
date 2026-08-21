# Maison Atelier AI Service

Separate Python HTTP service for jewelry concept / 3D generation.

The Next.js app talks to this service via `AI3D_API_URL` (default `http://localhost:8080`).
**Model weights are not stored in this repo.**

## Quick start (mock)

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8080
```

Health check: `GET http://localhost:8080/health`

## Providers

| `AI_SERVICE_PROVIDER` | Behavior |
|-----------------------|----------|
| `mock` (default) | Async fake job → placeholder GLB URL |
| `hunyuan` | Stub until Hunyuan3D-2 is installed (Phase 7–9) |

## Next.js env

```env
AI3D_PROVIDER=hunyuan
AI3D_API_URL=http://localhost:8080
AI3D_TIMEOUT=300000
```

For UI-only work without this service:

```env
AI3D_PROVIDER=mock
```

## Hardware

Real Hunyuan3D-2 generation needs a strong **NVIDIA GPU**. See `docs/AI-MODELS.md`.

## License

Review Hunyuan3D-2 upstream license before commercial use.
