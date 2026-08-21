"""Shared config for the AI service. Read from environment — never hard-code secrets."""

from __future__ import annotations

import os

HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("AI_SERVICE_PORT", "8080"))
PROVIDER = os.getenv("AI_SERVICE_PROVIDER", "mock")  # mock | hunyuan
OUTPUT_DIR = os.getenv("AI_SERVICE_OUTPUT_DIR", "outputs")
UPLOAD_DIR = os.getenv("AI_SERVICE_UPLOAD_DIR", "uploads")
