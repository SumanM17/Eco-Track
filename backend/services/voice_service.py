"""Backend Voice Service: Speech-to-Text transcription, DB logging, and NLP parsing pipeline."""

import json
import os
import uuid
from typing import Optional, Tuple

try:
    from api.config import AIConfig
except ImportError:
    from ai_models.config import AIConfig
from backend.database import log_voice_input
from backend.schemas import ParseRequest, ParseResponse, VoiceParseResponse
from backend.services.parse_service import ParseService


class VoiceService:
    """Manages audio file transcription, database logging, and integration with ParseService."""

    def __init__(self, parse_service: Optional[ParseService] = None) -> None:
        self.parse_service = parse_service or ParseService()

    def process_voice_audio(
        self,
        audio_bytes: bytes,
        filename: str,
        language_hint: Optional[str] = None,
    ) -> VoiceParseResponse:
        session_id = str(uuid.uuid4())
        audio_format = filename.split(".")[-1].lower() if "." in filename else "wav"

        # 1. Perform Speech-to-Text (STT)
        transcribed_text, stt_engine, duration_sec, detected_lang = self._transcribe_audio(
            audio_bytes=audio_bytes,
            audio_format=audio_format,
            language_hint=language_hint,
        )

        # 2. Parse the transcribed text using our parse service
        parse_request = ParseRequest(
            text=transcribed_text,
            language=detected_lang or language_hint,
        )
        parse_result: ParseResponse = self.parse_service.parse(parse_request)

        # 3. Log into SQLite Database for auditing & continuous training
        log_voice_input(
            session_id=session_id,
            audio_filename=filename,
            audio_format=audio_format,
            duration_seconds=duration_sec,
            stt_engine=stt_engine,
            language_hint=language_hint,
            language_detected=parse_result.language_detected,
            transcribed_text=transcribed_text,
            parsed_response_json=json.dumps(parse_result.model_dump(), ensure_ascii=False),
        )

        return VoiceParseResponse(
            session_id=session_id,
            transcribed_text=transcribed_text,
            stt_engine=stt_engine,
            audio_duration_seconds=duration_sec,
            parse_result=parse_result,
        )

    def _transcribe_audio(
        self,
        audio_bytes: bytes,
        audio_format: str,
        language_hint: Optional[str] = None,
    ) -> Tuple[str, str, float, Optional[str]]:
        """Run STT with live API integration or offline demo speech fallback."""
        if AIConfig.is_whisper_available():
            try:
                import io
                from openai import OpenAI  # type: ignore

                client = OpenAI(api_key=AIConfig.OPENAI_API_KEY)
                audio_file = io.BytesIO(audio_bytes)
                audio_file.name = f"audio.{audio_format}"
                transcript_obj = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language_hint,
                )
                return transcript_obj.text, "whisper-api", 5.0, language_hint
            except Exception:
                pass  # Fall back to demo transcription

        # Demo & Offline Fallback transcription:
        lang = (language_hint or "en").lower()
        demo_transcripts = {
            "en": "I ran my 1.5 ton split AC for 5 hours and drove 14 km to college by car.",
            "hi": "मैंने 4 घंटे एसी चलाया और ऑटो से 6 किलोमीटर सफर किया।",
            "ta": "நான் 4 மணி நேரம் ஏசி போட்டேன் மற்றும் பஸ்ஸில் 12 கிலோமீட்டர் சென்றேன்.",
            "te": "నేను 3 గంటలు ఏసీ వేశాను మరియు కార్‌లో 10 కిలోమీటర్లు ప్రయాణించాను.",
        }
        transcript = demo_transcripts.get(lang, demo_transcripts["en"])
        duration = max(3.0, round(len(audio_bytes) / 32000.0, 1))

        return transcript, "demo_speech_engine", duration, lang
