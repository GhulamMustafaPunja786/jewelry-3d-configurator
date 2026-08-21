from __future__ import annotations

import time
import uuid
from typing import Dict

from generators.base import (
    BaseGenerator,
    GenerationRequest,
    GenerationResult,
    JobStatus,
)


class MockGenerator(BaseGenerator):
    """
    Development stub. Pretends to generate a GLB after a short delay.
    Serves a placeholder URL the Next.js mock provider can also use.
    """

    provider_id = "mock"

    def __init__(self, delay_seconds: float = 2.5) -> None:
        self.delay_seconds = delay_seconds
        self._jobs: Dict[str, dict] = {}

    def start(self, request: GenerationRequest) -> GenerationResult:
        job_id = request.client_job_id or f"svc_{uuid.uuid4().hex[:12]}"
        self._jobs[job_id] = {
            "request": request,
            "created": time.time(),
            "status": JobStatus.QUEUED,
        }
        return GenerationResult(
            job_id=job_id,
            status=JobStatus.QUEUED,
            progress_message="Understanding your design...",
        )

    def status(self, job_id: str) -> GenerationResult:
        job = self._jobs.get(job_id)
        if not job:
            return GenerationResult(
                job_id=job_id,
                status=JobStatus.FAILED,
                error="Unknown job id",
            )

        elapsed = time.time() - job["created"]
        if elapsed < self.delay_seconds * 0.35:
            status = JobStatus.QUEUED
            message = "Understanding your design..."
        elif elapsed < self.delay_seconds:
            status = JobStatus.PROCESSING
            message = "Building your 3D model..."
        else:
            status = JobStatus.COMPLETED
            message = "Preparing your interactive preview..."
            job["status"] = status
            job["model_url"] = f"/models/ai-mock/{job['request'].jewelry_type}.glb"
            job["preview_image_url"] = (
                job["request"].concept_image
                or job["request"].reference_image
                or f"/images/ai-placeholders/{job['request'].jewelry_type}-concept.svg"
            )

        job["status"] = status
        return GenerationResult(
            job_id=job_id,
            status=status,
            progress_message=message,
            model_url=job.get("model_url"),
            preview_image_url=job.get("preview_image_url"),
        )

    def result(self, job_id: str) -> GenerationResult:
        current = self.status(job_id)
        if current.status != JobStatus.COMPLETED:
            return current
        return current
