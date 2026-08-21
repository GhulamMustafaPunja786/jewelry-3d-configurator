"""
Hunyuan3D-2 generator stub.

Real weights / CUDA runtime are installed per docs/AI-MODELS.md and Hunyuan README.
This class will call the local Hunyuan API in a later phase.
"""

from __future__ import annotations

from generators.base import (
    BaseGenerator,
    GenerationRequest,
    GenerationResult,
    JobStatus,
)


class HunyuanGenerator(BaseGenerator):
    provider_id = "hunyuan"

    def start(self, request: GenerationRequest) -> GenerationResult:
        return GenerationResult(
            job_id=request.client_job_id or "hunyuan_not_wired",
            status=JobStatus.FAILED,
            error=(
                "Hunyuan3D generator is not wired yet. "
                "Install Hunyuan3D-2 per docs/AI-MODELS.md and complete Phase 7–9."
            ),
        )

    def status(self, job_id: str) -> GenerationResult:
        return GenerationResult(
            job_id=job_id,
            status=JobStatus.FAILED,
            error="Hunyuan3D generator is not wired yet.",
        )

    def result(self, job_id: str) -> GenerationResult:
        return self.status(job_id)
