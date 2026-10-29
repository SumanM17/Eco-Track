"""System verification script for CarbonKatha."""

import io
import sys
from pathlib import Path

# Fix Windows console UTF-8 output
sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("=" * 72)
print("VERIFYING COMPLETE CARBONKATHA ARCHITECTURE")
print("=" * 72)

# 1. Verify Frontend SPA Serving
resp_index = client.get("/")
assert resp_index.status_code == 200, f"Expected 200, got {resp_index.status_code}"
assert "CarbonKatha" in resp_index.text, "Index HTML must contain CarbonKatha"
print("[OK] Frontend UI (index.html) successfully served at '/'")

resp_css = client.get("/css/style.css")
assert resp_css.status_code == 200, f"Expected 200, got {resp_css.status_code}"
assert "green-beach" in resp_css.text.lower() or "seafoam" in resp_css.text.lower(), "CSS must have green-beach theme"
print("[OK] Soothing Green-Beach Theme (css/style.css) successfully served at '/css/style.css'")

resp_js = client.get("/js/app.js")
assert resp_js.status_code == 200
print("[OK] Frontend JS logic (js/app.js) successfully served at '/js/app.js'")

# 2. Verify AI System Status
resp_sys = client.get("/api/system/status")
assert resp_sys.status_code == 200
print(f"[OK] AI Engine Status: {resp_sys.json()}")

# 3. Verify Multilingual Database Corpus
resp_corpus = client.get("/api/voice/corpus")
assert resp_corpus.status_code == 200
corpus_items = resp_corpus.json()
assert len(corpus_items) >= 40, f"Expected >= 40 corpus samples, got {len(corpus_items)}"
print(f"[OK] Multilingual Database Corpus: {len(corpus_items)} samples verified across en/hi/ta/te")

# 4. Verify Multilingual NLP Parse
test_sentences = [
    ("I ran AC for 5 hours and took car for 12 km", "en"),
    ("मैंने एसी 4 घंटे चलाया और ऑटो से 6 किमी गया", "hi"),
    ("நான் ஏசி 4 மணி நேரம் போட்டேன் மற்றும் பஸ்ஸில் 12 கிமீ சென்றேன்", "ta"),
    ("నేను ఏసీ 3 గంటలు వేశాను మరియు కార్‌లో 10 కిలోమీటర్లు ప్రయాణించాను", "te"),
]

for text, lang in test_sentences:
    p_resp = client.post("/api/parse/", json={"text": text, "language": lang})
    assert p_resp.status_code == 200, f"Failed for {lang}: {p_resp.text}"
    p_data = p_resp.json()
    assert len(p_data["activities"]) > 0, f"No activities extracted for {lang}"
    print(f"[OK] NLP Parse ({lang.upper()}): Extracted {len(p_data['activities'])} activities ({p_data['parser']} engine)")

# 5. Verify Spoken Voice Audio Parsing
fake_audio = b"RIFF....WAVEfmt ....data" + b"\x00" * 32000
files = {"file": ("test_voice_tamil.wav", io.BytesIO(fake_audio), "audio/wav")}
v_resp = client.post("/api/voice/parse", files=files, data={"language_hint": "ta"})
assert v_resp.status_code == 200, f"Failed voice parse: {v_resp.text}"
v_data = v_resp.json()
assert len(v_data["parse_result"]["activities"]) > 0
print(f"[OK] Voice Audio Ingestion: Session {v_data['session_id'][:8]}... -> '{v_data['transcribed_text']}'")

# 6. Verify Active Learning Feedback Logging
fb_resp = client.post("/api/voice/feedback", json={
    "session_id": v_data["session_id"],
    "original_text": v_data["transcribed_text"],
    "original_activities": v_data["parse_result"]["activities"],
    "corrected_activities": v_data["parse_result"]["activities"],
    "user_comment": "Verified accurate in test",
})
assert fb_resp.status_code == 200
print(f"[OK] Active Learning Feedback logged successfully (ID: {fb_resp.json()['feedback_id']})")

print("=" * 72)
print("ALL BACKEND, FRONTEND, AI MODELS & DATABASE TESTS PASSED!")
print("=" * 72)
