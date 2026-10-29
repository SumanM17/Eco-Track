"""Pydantic schemas for CarbonKatha Backend."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Activity(BaseModel):
    """One structured activity extracted from the user's free-text or spoken input."""

    category: str = Field(
        ...,
        description="electricity | transport | fuel | waste | unknown",
    )
    item: str = Field(..., max_length=80)
    value: float = Field(default=1.0, ge=0)
    unit: str = Field(..., max_length=20)
    frequency: str = Field(default="daily")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)


class ParseRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: Optional[str] = Field(
        default=None,
        description="en | hi | ta | te. Auto-detected when omitted.",
    )


class ParseResponse(BaseModel):
    activities: List[Activity]
    assumptions: List[str] = Field(default_factory=list)
    follow_up_question: Optional[str] = None
    parser: str = Field(default="claude", description="claude | fallback")
    language_detected: str


class VoiceParseResponse(BaseModel):
    """Full response for spoken voice audio parsing."""

    session_id: str
    transcribed_text: str
    stt_engine: str
    audio_duration_seconds: Optional[float] = None
    parse_result: ParseResponse


class FeedbackRequest(BaseModel):
    """Active learning user correction payload."""

    session_id: str
    original_text: str
    original_activities: List[Dict[str, Any]]
    corrected_activities: List[Dict[str, Any]]
    user_comment: Optional[str] = None


class CorpusItem(BaseModel):
    """Training corpus item representation."""

    id: int
    language: str
    modality: str
    script_type: str
    raw_text: str
    activities: List[Dict[str, Any]]
    assumptions: List[str]
    is_few_shot: bool
