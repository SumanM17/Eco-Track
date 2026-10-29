"""Offline demo of POST /parse — runs the rule-based fallback (no API key needed)."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Windows console fix: print Hindi/Tamil/Telugu scripts as UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Force offline mode: no Anthropic key => rule-based fallback only
os.environ.pop("ANTHROPIC_API_KEY", None)

from backend.services.parse_service import ParseService

service = ParseService()

EXAMPLES = [
    # ---------------- English ----------------
    ("I ran the AC for 6 hours and drove 12 km to office today.", "en"),
    ("Used the washing machine for 1 hour and took an Uber for 5 km.", "en"),
    # ---------------- Hindi (Devanagari) ----------------
    ("मैंने एसी 4 घंटे चलाया और ऑटो से 6 किमी गया।", "hi"),
    ("फ्रिज रात भर चला और खाने का कचरा 1 किलो निकला।", "hi"),
    # ---------------- Hindi (Hinglish / Latin script) ----------------
    ("AC chala 4 ghante, auto se 6 km gaya, fridge raat bhar chala.", "hi"),
    # ---------------- Tamil (native script + digits) ----------------
    ("நான் ஏசி ஐந்து மணி நேரம் பயன்படுத்தினேன் மற்றும் பேஸ் மூலம் 12 கிலோமீட்டர் சென்றேன்.", "ta"),
    ("ஃப்ரிஜ் ரோজ் நেভு மற்றும் ஸ்கூட்டி 5 கிலோமீட்டர்.", "ta"),
    # ---------------- Telugu (code-mixed, Telugu script) ----------------
    ("నేను ఏసీ 2 గంటలు నడిపేశాను మరియు ఆటోతో 6 కిలోమీటర్లు ప్రయాణించాను.", "te"),
    ("ఫ్రిజ్ పూర్తి రోజు నడిచింది మరియు ఆహార వ్యర్థాలు 1 కిలో.", "te"),
]

print("=" * 72)
print("CarbonKatha /parse — offline demo (rule-based fallback)")
print("=" * 72)
for text, lang in EXAMPLES:
    result = service.parse(type("Req", (), {"text": text, "language": lang})())
    print("-" * 72)
    print(f"INPUT   ({lang}): {text}")
    print(f"DETECTED: {result.language_detected}  PARSER: {result.parser}")
    print(json.dumps(result.model_dump(), ensure_ascii=False, indent=2))

print("=" * 72)
print("Demo complete. Add ANTHROPIC_API_KEY to .env to use Claude instead.")
