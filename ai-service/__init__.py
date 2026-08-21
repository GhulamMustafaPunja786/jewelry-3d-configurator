"""
Maison Atelier — AI Generation Service (skeleton)

This service will wrap local Hunyuan3D-2 (and mock generators).
It does NOT run inside Next.js and must NOT contain secrets in git.

Phase 2: interfaces + mock HTTP API only.
Later phases: real Hunyuan wiring.
"""

from __future__ import annotations

from generators.base import GenerationRequest, GenerationResult, JobStatus
from generators.mock import MockGenerator

__all__ = [
    "GenerationRequest",
    "GenerationResult",
    "JobStatus",
    "MockGenerator",
]
