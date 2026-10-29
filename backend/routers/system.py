"""FastAPI router for AI Engine status and API Key management."""

import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

try:
    from api.config import AIConfig
except ImportError:
    from ai_models.config import AIConfig

router = APIRouter(prefix="/api/system", tags=["System & AI Config"])


class UpdateKeyRequest(BaseModel):
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_model: Optional[str] = None


@router.get("/status")
def get_system_status():
    """Return status of AI models and API keys."""
    return AIConfig.get_status_dict()


@router.post("/config")
def update_system_config(req: UpdateKeyRequest):
    """Allows setting or updating API keys dynamically from the UI."""
    updated = []
    if req.anthropic_api_key:
        AIConfig.ANTHROPIC_API_KEY = req.anthropic_api_key.strip()
        os.environ["ANTHROPIC_API_KEY"] = AIConfig.ANTHROPIC_API_KEY
        updated.append("ANTHROPIC_API_KEY")

    if req.openai_api_key:
        AIConfig.OPENAI_API_KEY = req.openai_api_key.strip()
        os.environ["OPENAI_API_KEY"] = AIConfig.OPENAI_API_KEY
        updated.append("OPENAI_API_KEY")

    if req.anthropic_model:
        AIConfig.ANTHROPIC_MODEL = req.anthropic_model.strip()
        os.environ["ANTHROPIC_MODEL"] = AIConfig.ANTHROPIC_MODEL
        updated.append("ANTHROPIC_MODEL")

    return {
        "status": "success",
        "updated": updated,
        "current_status": AIConfig.get_status_dict(),
    }
