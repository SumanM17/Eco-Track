"""FastAPI router for voice audio parsing, corpus training data, and active learning."""

import json
from typing import List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from backend.database import get_db_connection, log_feedback_entry
from backend.schemas import CorpusItem, FeedbackRequest, VoiceParseResponse
from backend.services.voice_service import VoiceService

router = APIRouter(prefix="/api/voice", tags=["Voice & Language Database"])
voice_service = VoiceService()


@router.post(
    "/parse",
    response_model=VoiceParseResponse,
    summary="Upload voice audio file -> Speech-to-Text -> Structured Carbon Data",
)
async def parse_voice(
    file: UploadFile = File(..., description="Audio file of spoken routine"),
    language_hint: Optional[str] = Form(None, description="'en', 'hi', 'ta', 'te'"),
) -> VoiceParseResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid audio file is required",
        )

    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file cannot be empty",
        )

    return voice_service.process_voice_audio(
        audio_bytes=audio_bytes,
        filename=file.filename,
        language_hint=language_hint,
    )


@router.get(
    "/corpus",
    response_model=List[CorpusItem],
    summary="Query the multilingual voice & language training dataset",
)
def get_corpus(language: Optional[str] = None) -> List[CorpusItem]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if language:
            cursor.execute(
                """
                SELECT id, language, modality, script_type, raw_text,
                       activities_json, assumptions_json, is_few_shot
                FROM training_corpus
                WHERE language = ?
                ORDER BY id ASC
                """,
                (language.lower(),),
            )
        else:
            cursor.execute(
                """
                SELECT id, language, modality, script_type, raw_text,
                       activities_json, assumptions_json, is_few_shot
                FROM training_corpus
                ORDER BY id ASC
                """
            )
        rows = cursor.fetchall()
        return [
            CorpusItem(
                id=r["id"],
                language=r["language"],
                modality=r["modality"],
                script_type=r["script_type"],
                raw_text=r["raw_text"],
                activities=json.loads(r["activities_json"]),
                assumptions=json.loads(r["assumptions_json"]),
                is_few_shot=bool(r["is_few_shot"]),
            )
            for r in rows
        ]


@router.post(
    "/feedback",
    summary="Log user corrections on activities/assumptions for active learning",
)
def submit_feedback(feedback: FeedbackRequest):
    row_id = log_feedback_entry(
        session_id=feedback.session_id,
        original_text=feedback.original_text,
        original_activities=feedback.original_activities,
        corrected_activities=feedback.corrected_activities,
        user_comment=feedback.user_comment,
    )
    return {
        "status": "success",
        "message": "Feedback recorded for continuous model calibration",
        "feedback_id": row_id,
    }


@router.get(
    "/logs",
    summary="Retrieve recent voice sessions logged in the database",
)
def get_voice_logs(limit: int = 20):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, session_id, audio_filename, audio_format, duration_seconds,
                   stt_engine, language_detected, transcribed_text,
                   parsed_response_json, created_at
            FROM voice_logs
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        return [
            {
                "id": r["id"],
                "session_id": r["session_id"],
                "audio_filename": r["audio_filename"],
                "audio_format": r["audio_format"],
                "duration_seconds": r["duration_seconds"],
                "stt_engine": r["stt_engine"],
                "language_detected": r["language_detected"],
                "transcribed_text": r["transcribed_text"],
                "parsed_response": json.loads(r["parsed_response_json"]) if r["parsed_response_json"] else None,
                "created_at": r["created_at"],
            }
            for r in rows
        ]
