"""
Minimal FastAPI stub for local AI generation.

Run (from ai-service/):
  pip install -r requirements.txt
  uvicorn app:app --host 0.0.0.0 --port 8080

Default provider is mock. Hunyuan is stubbed until Phase 7–9.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

import config
from generators.base import GenerationRequest
from generators.hunyuan import HunyuanGenerator
from generators.mock import MockGenerator

app = FastAPI(title="Maison Atelier AI Service", version="0.1.0")


def get_generator():
    if config.PROVIDER.lower() in {"hunyuan", "hunyuan3d"}:
        return HunyuanGenerator()
    return MockGenerator()


generator = get_generator()


class GenerateBody(BaseModel):
    prompt: str
    jewelry_type: str = "ring"
    mode: str = "text"
    negative_prompt: Optional[str] = None
    reference_image: Optional[str] = None
    concept_image: Optional[str] = None
    client_job_id: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
def health():
    return {
        "ok": True,
        "provider": generator.provider_id,
    }


@app.post("/generate")
def generate(body: GenerateBody):
    request = GenerationRequest(
        prompt=body.prompt,
        jewelry_type=body.jewelry_type,
        mode=body.mode,
        negative_prompt=body.negative_prompt,
        reference_image=body.reference_image,
        concept_image=body.concept_image,
        client_job_id=body.client_job_id,
        metadata=body.metadata,
    )
    result = generator.start(request)
    return {
        "job_id": result.job_id,
        "status": result.status.value,
        "progress_message": result.progress_message,
        "error": result.error,
    }


@app.get("/jobs/{job_id}")
def job_status(job_id: str):
    result = generator.status(job_id)
    return {
        "job_id": result.job_id,
        "status": result.status.value,
        "progress_message": result.progress_message,
        "error": result.error,
        "model_url": result.model_url,
        "preview_image_url": result.preview_image_url,
    }


@app.get("/jobs/{job_id}/result")
def job_result(job_id: str):
    result = generator.result(job_id)
    if result.status.value != "COMPLETED" or not result.model_url:
        raise HTTPException(status_code=409, detail="Result not ready")
    return {
        "job_id": result.job_id,
        "status": result.status.value,
        "model_url": result.model_url,
        "preview_image_url": result.preview_image_url,
        "error": result.error,
    }
