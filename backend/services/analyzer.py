"""
Veritas — Case Analyzer Service
Uses Google Gemini to generate investigative leads, blind-spot checklists,
and case summaries based on structurally similar resolved cases.
The Gemini client is initialized once at module level.
"""

import os
import json
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
1. Generate a ranked list of investigative leads for the new case. For each lead specify: action, priority (High / Mid / Low), which source case it came from, and a confidence score (0-100).
2. Generate a blind spot checklist — things the resolved cases flagged as missed early on that the investigator should not miss this time.
3. Write a one paragraph summary of your findings.

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

    # Call Gemini
    response = _model.generate_content(prompt)

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
