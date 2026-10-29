"""Anthropic Claude API client for CarbonKatha NLP parsing."""

import json
import re
from typing import Any, Dict, List, Optional

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None  # type: ignore

try:
    from api.config import AIConfig
except ImportError:
    from ai_models.config import AIConfig


class ClaudeLanguageEngine:
    """Invokes Anthropic Claude model to transform natural language descriptions into structured JSON."""

    def __init__(self) -> None:
        self.api_key = AIConfig.ANTHROPIC_API_KEY
        self.model = AIConfig.ANTHROPIC_MODEL
        self.temperature = AIConfig.ANTHROPIC_TEMPERATURE
        self.max_tokens = AIConfig.ANTHROPIC_MAX_TOKENS

        self.client = Anthropic(api_key=self.api_key) if (Anthropic and self.api_key) else None

        # Load system prompt template
        if AIConfig.PARSE_SYSTEM_PROMPT_PATH.exists():
            with open(AIConfig.PARSE_SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
                self.system_prompt = f.read()
        else:
            self.system_prompt = "You are CarbonKatha language engine. Return strictly valid JSON."

    def is_ready(self) -> bool:
        return self.client is not None

    def parse_with_claude(
        self,
        text: str,
        lang: str,
        few_shot_exemplars: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Send prompt to Claude and extract structured JSON."""
        if not self.client:
            raise RuntimeError("Claude API client is not configured or ANTHROPIC_API_KEY is missing.")

        few_shot_block = ""
        if few_shot_exemplars:
            few_shot_block = "VERIFIED IN-CONTEXT DATABASE EXEMPLARS FOR THIS LANGUAGE:\n"
            for item in few_shot_exemplars:
                payload = {
                    "activities": item.get("activities", []),
                    "assumptions": item.get("assumptions", []),
                    "follow_up_question": None,
                }
                few_shot_block += f"Input: \"{item.get('raw_text', '')}\"\nOutput: {json.dumps(payload, ensure_ascii=False)}\n\n"

        user_content = (
            f"INPUT LANGUAGE: {lang}\n\n"
            f"{few_shot_block}"
            f"USER INPUT TO PARSE: {text}\n\n"
            "Return ONLY the single JSON object with keys: activities, assumptions, follow_up_question."
        )

        resp = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            system=self.system_prompt,
            messages=[{"role": "user", "content": user_content}],
        )

        raw = "".join(getattr(block, "text", "") for block in resp.content)
        return self._extract_json_object(raw)

    @staticmethod
    def _extract_json_object(raw: str) -> dict:
        """Robustly extract JSON object from LLM response."""
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        start = cleaned.find("{")
        if start == -1:
            raise ValueError("No JSON object found in model response")

        depth = 0
        end = -1
        for i in range(start, len(cleaned)):
            if cleaned[i] == "{":
                depth += 1
            elif cleaned[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        if end == -1:
            raise ValueError("Unbalanced JSON in model response")

        return json.loads(cleaned[start : end + 1])
