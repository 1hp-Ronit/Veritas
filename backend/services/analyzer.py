"""
Veritas — Case Analyzer Service
Uses Google Gemini to generate investigative leads, blind-spot checklists,
and case summaries based on structurally similar resolved cases.
The Gemini client is initialized once at module level.
"""

import os
import json
import time
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# ---------------------------------------------------------------------------
# Initialize Gemini client (module-level, no re-init per request)
# ---------------------------------------------------------------------------
_api_key = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=_api_key)
_model = genai.GenerativeModel("gemini-2.5-flash")

# ---------------------------------------------------------------------------
# Prompt template for case analysis
# ---------------------------------------------------------------------------
_PROMPT_TEMPLATE = """
You are Veritas, an AI case intelligence assistant for investigators.

A new case has just been opened:
---
{new_case_json}
---

The following resolved cases were retrieved as structurally similar:
---
{similar_cases_json}
---

Based on the resolved cases, do the following:
1. Generate a ranked list of the TOP 7 (maximum) most actionable investigative leads for the new case. For each lead specify: action, priority (High / Mid / Low), which source case it came from, and a confidence score (0-100). Focus on quality over quantity — only include the most impactful leads.
2. Generate a blind spot checklist of up to 5 items — the most critical things the resolved cases flagged as missed early on that the investigator should not miss this time.
3. Write a concise one paragraph summary of your findings (3-4 sentences max).

Respond strictly in this JSON format:
{{
  "ranked_leads": [
    {{"action": "...", "priority": "High", "source_case": "...", "confidence": 90}}
  ],
  "blind_spot_checklist": ["...", "..."],
  "summary": "..."
}}
"""


def analyze_case(new_case: dict, similar_cases: list[dict]) -> dict:
    """
    Analyze a new case against a list of structurally similar resolved cases.
    Sends a structured prompt to Gemini 1.5 Flash and parses the JSON response.

    Returns a dict with keys:
      - ranked_leads:        list of {action, priority, source_case, confidence}
      - blind_spot_checklist: list of strings
      - summary:             str
    """
    # Serialize case data for the prompt
    new_case_json = json.dumps(new_case, indent=2, default=str)
    similar_cases_json = json.dumps(similar_cases, indent=2, default=str)

    prompt = _PROMPT_TEMPLATE.format(
        new_case_json=new_case_json,
        similar_cases_json=similar_cases_json,
    )

    # Call Gemini with retry logic for rate limiting
    max_retries = 3
    retry_delay = 15  # seconds

    for attempt in range(max_retries + 1):
        try:
            response = _model.generate_content(prompt)
            break
        except Exception as e:
            error_msg = str(e).lower()
            if ("quota" in error_msg or "rate" in error_msg or "429" in error_msg or "resource" in error_msg) and attempt < max_retries:
                wait_time = retry_delay * (attempt + 1)
                print(f"[Gemini] Rate limited (attempt {attempt + 1}/{max_retries}). Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise

    # Extract and parse the JSON from the response
    response_text = response.text.strip()

    # Handle markdown-wrapped JSON (```json ... ```)
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        # Remove first and last lines (``` markers)
        json_lines = []
        inside = False
        for line in lines:
            if line.strip().startswith("```") and not inside:
                inside = True
                continue
            elif line.strip() == "```" and inside:
                break
            elif inside:
                json_lines.append(line)
        response_text = "\n".join(json_lines)

    try:
        result = json.loads(response_text)
    except json.JSONDecodeError:
        # Fallback: return the raw text if parsing fails
        result = {
            "ranked_leads": [],
            "blind_spot_checklist": [],
            "summary": response_text,
        }

    return result
