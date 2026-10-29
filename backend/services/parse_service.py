"""Backend Parse Service: Orchestrates Claude AI Engine, In-Context DB Exemplars, and Fallback Engine."""

import sys
from pathlib import Path
from typing import Optional

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from api.claude_client import ClaudeLanguageEngine
    from api.fallback_engine import MultilingualFallbackEngine
except ImportError:
    from ai_models.claude_client import ClaudeLanguageEngine
    from ai_models.fallback_engine import MultilingualFallbackEngine
from backend.database import get_few_shot_exemplars
from backend.schemas import Activity, ParseRequest, ParseResponse


class ParseService:
    """Combines Claude AI Model and the Multilingual Fallback Engine."""

    def __init__(self) -> None:
        self.claude_engine = ClaudeLanguageEngine()
        self.fallback_engine = MultilingualFallbackEngine

    def parse(self, req: ParseRequest) -> ParseResponse:
        text = req.text.strip()
        lang = (req.language or "").strip().lower() or self.fallback_engine.detect_language(text)
        if lang not in ("en", "hi", "ta", "te"):
            lang = "en"

        # 1. Try Claude AI Model with In-Context Few-Shot Training Exemplars from Database
        if self.claude_engine.is_ready():
            try:
                few_shots = get_few_shot_exemplars(lang, limit=2)
                data = self.claude_engine.parse_with_claude(
                    text=text,
                    lang=lang,
                    few_shot_exemplars=few_shots,
                )
                activities = [Activity(**a) for a in data.get("activities", [])]
                return ParseResponse(
                    activities=activities,
                    assumptions=list(data.get("assumptions", [])),
                    follow_up_question=data.get("follow_up_question"),
                    parser="claude",
                    language_detected=lang,
                )
            except Exception:
                # Silent graceful fallback to keep demo 100% operational
                pass

        # 2. Deterministic Multilingual Fallback Engine
        fb_data = self.fallback_engine.parse(text, lang)
        activities = [Activity(**a) for a in fb_data.get("activities", [])]
        return ParseResponse(
            activities=activities,
            assumptions=list(fb_data.get("assumptions", [])),
            follow_up_question=fb_data.get("follow_up_question"),
            parser="fallback",
            language_detected=lang,
        )
