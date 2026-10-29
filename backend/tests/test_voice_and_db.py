"""Test suite for CarbonKatha Voice & Language Database Integration."""

import io
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import init_db, seed_corpus_if_empty, get_db_connection

client = TestClient(app)

print("=" * 72)
print("Testing CarbonKatha Voice & Language Database Integration")
print("=" * 72)

# 1. Test Database Init & Seeding
init_db()
count = seed_corpus_if_empty()
print(f"[OK] Database initialized. Training corpus count: {count} samples.")

# 2. Test GET /api/voice/corpus
resp = client.get("/api/voice/corpus")
assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
corpus = resp.json()
print(f"[OK] GET /api/voice/corpus returned {len(corpus)} items.")

# Test language filtering
for lang in ("en", "hi", "ta", "te"):
    resp_lang = client.get(f"/api/voice/corpus?language={lang}")
    assert resp_lang.status_code == 200
    items = resp_lang.json()
    print(f"  - Language '{lang}': {len(items)} verified spoken/text training samples in database.")

# 3. Test POST /api/voice/parse with simulated audio
fake_audio = b"RIFF....WAVEfmt ....data" + b"\x00" * 32000  # 1 second simulated wav audio
files = {"file": ("daily_routine_hindi.wav", io.BytesIO(fake_audio), "audio/wav")}
data = {"language_hint": "hi"}

voice_resp = client.post("/api/voice/parse", files=files, data=data)
assert voice_resp.status_code == 200, f"Expected 200, got {voice_resp.status_code}: {voice_resp.text}"
voice_data = voice_resp.json()
print("[OK] POST /api/voice/parse succeeded:")
print(f"  - Session ID: {voice_data['session_id']}")
print(f"  - Transcribed Text: {voice_data['transcribed_text']}")
print(f"  - STT Engine: {voice_data['stt_engine']}")
print(f"  - Parsed Activities Count: {len(voice_data['parse_result']['activities'])}")

# 4. Test GET /api/voice/logs
logs_resp = client.get("/api/voice/logs")
assert logs_resp.status_code == 200
logs = logs_resp.json()
assert len(logs) > 0
print(f"[OK] GET /api/voice/logs returned {len(logs)} logged voice sessions.")
print(f"  - Latest logged audio: {logs[0]['audio_filename']} ({logs[0]['language_detected']})")

# 5. Test POST /api/voice/feedback (Active Learning)
feedback_payload = {
    "session_id": voice_data["session_id"],
    "original_text": voice_data["transcribed_text"],
    "original_activities": voice_data["parse_result"]["activities"],
    "corrected_activities": [
        {
            "category": "electricity",
            "item": "Air conditioner",
            "value": 4.5,
            "unit": "hours",
            "frequency": "daily",
            "confidence": 1.0,
        }
    ],
    "user_comment": "User changed AC runtime from 4 to 4.5 hours",
}
fb_resp = client.post("/api/voice/feedback", json=feedback_payload)
assert fb_resp.status_code == 200
print(f"[OK] POST /voice/feedback recorded user correction with ID: {fb_resp.json()['feedback_id']}")

print("=" * 72)
print("All Voice and Language Database tests PASSED successfully!")
print("=" * 72)
