"""AI Models and API Key configuration for CarbonKatha."""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load .env file from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class AIConfig:
    """Manages AI model configurations, API keys, and model parameters."""

    # Anthropic Claude API Configuration
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
    ANTHROPIC_TEMPERATURE: float = 0.2
    ANTHROPIC_MAX_TOKENS: int = 800

    # Speech-to-Text (STT) Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    BHASHINI_API_KEY: Optional[str] = os.getenv("BHASHINI_API_KEY")

    # Prompt Template Paths
    PROMPTS_DIR: Path = Path(__file__).resolve().parent / "prompts"
    PARSE_SYSTEM_PROMPT_PATH: Path = PROMPTS_DIR / "parse_system_prompt.txt"

    # Supported Languages
    SUPPORTED_LANGUAGES = ["en", "hi", "ta", "te", "kn"]

    @classmethod
    def is_claude_available(cls) -> bool:
        """Check if Claude API key is configured."""
        return bool(cls.ANTHROPIC_API_KEY and len(cls.ANTHROPIC_API_KEY.strip()) > 10)

    @classmethod
    def is_whisper_available(cls) -> bool:
        """Check if OpenAI Whisper STT API key is configured."""
        return bool(cls.OPENAI_API_KEY and len(cls.OPENAI_API_KEY.strip()) > 10)

    @classmethod
    def get_status_dict(cls) -> dict:
        """Return human-readable AI engine status."""
        return {
            "claude_nlp_configured": cls.is_claude_available(),
            "claude_model": cls.ANTHROPIC_MODEL,
            "whisper_stt_configured": cls.is_whisper_available(),
            "fallback_engine_ready": True,
            "supported_languages": cls.SUPPORTED_LANGUAGES,
        }
