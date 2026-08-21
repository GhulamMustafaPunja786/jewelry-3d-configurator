from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


@dataclass
class GenerationRequest:
    prompt: str
    jewelry_type: str = "ring"
    mode: str = "text"  # text | image
    negative_prompt: Optional[str] = None
    reference_image: Optional[str] = None
    concept_image: Optional[str] = None
    client_job_id: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class GenerationResult:
    job_id: str
    status: JobStatus
    model_url: Optional[str] = None
    preview_image_url: Optional[str] = None
    progress_message: Optional[str] = None
    error: Optional[str] = None


class BaseGenerator(ABC):
    """Provider interface for Hunyuan / mock / future models."""

    provider_id: str = "base"

    @abstractmethod
    def start(self, request: GenerationRequest) -> GenerationResult:
        ...

    @abstractmethod
    def status(self, job_id: str) -> GenerationResult:
        ...

    @abstractmethod
    def result(self, job_id: str) -> GenerationResult:
        ...
