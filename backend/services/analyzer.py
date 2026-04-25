"""
Veritas — Case Analyzer Service
Uses Google Gemini to generate investigative leads, blind-spot checklists,
and case summaries based on structurally similar resolved cases.
The Gemini client is initialized once at module level.
"""

import os
import json
import time
import logging
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Initialize Gemini client (module-level, no re-init per request)
# ---------------------------------------------------------------------------
_api_key = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=_api_key)
_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-2.0-flash",
    "gemini-flash-latest"
]

# ---------------------------------------------------------------------------
# Prompt template for case analysis
# ---------------------------------------------------------------------------
_PROMPT_TEMPLATE = """
You are Veritas, an elite AI investigative analyst and case intelligence assistant.
Your goal is to provide highly actionable, hyper-specific insights to assist detectives.

A new active case has just been opened:
---
{new_case_json}
---

We have retrieved the following structurally similar resolved cases from our database:
---
{similar_cases_json}
---

Analyze the modus operandi, blind spots, and resolutions from the historical cases and map them to the context of the new case. 

Perform the following tasks:
1. Generate a ranked list of the TOP 7 (maximum) most actionable investigative leads. 
   - Ensure actions are highly specific to the context (e.g., instead of "Check CCTV", use "Check CCTV along the suspect's likely egress route").
   - Specify priority (High / Mid / Low).
   - Attribute the insight to a specific source_case ID.
   - Provide a confidence score (0-100) based on how strongly the historical MO aligns with the new case.
2. Generate a blind spot checklist of up to 5 items. 
   - Highlight critical pitfalls, ignored evidence, or missteps from the historical cases that the investigator must avoid in this active case.
3. Write a concise, professional summary (3-4 sentences max) explaining the key patterns linking these cases and the recommended investigative strategy.

Respond STRICTLY in this exact JSON format, with no markdown formatting around the output, no explanations outside the JSON, and no trailing commas:
{{
  "ranked_leads": [
    {{"action": "...", "priority": "High", "source_case": "...", "confidence": 90}}
  ],
  "blind_spot_checklist": ["...", "..."],
  "summary": "..."
}}
"""


def _build_fallback_analysis(new_case: dict, similar_cases: list[dict]) -> dict:
    """
    Generate a basic analysis locally when Gemini is unavailable.
    Uses the similar cases metadata directly — no LLM call required.
    """
    case_id = new_case.get("case_id", "unknown")
    incident_type = new_case.get("incident_type", "unknown").replace("_", " ")

    leads = []
    for idx, sc in enumerate(similar_cases[:7]):
        sc_id = sc.get("case_id", f"case-{idx}")
        sc_mo = sc.get("modus_operandi", "")
        sc_type = sc.get("incident_type", "")
        similarity = sc.get("similarity_score", 0)

        if sc_mo:
            action = f"Review MO from {sc_id}: {sc_mo[:120]}{'...' if len(sc_mo) > 120 else ''}"
        else:
            action = f"Cross-reference with resolved case {sc_id} ({sc_type})"

        leads.append({
            "action": action,
            "priority": "High" if similarity > 70 else ("Mid" if similarity > 40 else "Low"),
            "source_case": sc_id,
            "confidence": max(int(similarity), 10),
        })

    blind_spots = [
        "Verify witness statements against CCTV timelines",
        "Check for similar incidents in neighbouring jurisdictions",
        "Re-examine physical evidence with updated forensic techniques",
    ]

    summary = (
        f"Fallback analysis (Gemini unavailable). Found {len(similar_cases)} similar "
        f"cases for {incident_type} case {case_id}. Review the ranked leads derived "
        f"from historical case metadata for investigative direction."
    )

    return {
        "ranked_leads": leads,
        "blind_spot_checklist": blind_spots,
        "summary": summary,
    }


def analyze_case(new_case: dict, similar_cases: list[dict]) -> dict:
    """
    Analyze a new case against a list of structurally similar resolved cases.
    Sends a structured prompt to Gemini and parses the JSON response.

    Rate-limit strategy:
      - 2 retries max with exponential backoff (30s → 60s)
      - If Gemini remains unavailable, falls back to a locally-generated
        analysis so the user always gets a result.

    Returns a dict with keys:
      - ranked_leads:        list of {action, priority, source_case, confidence}
      - blind_spot_checklist: list of strings
      - summary:             str
    """
    # Strip down to top 4 cases and only keep essential fields to save tokens
    optimized_similar_cases = []
    for sc in similar_cases[:4]:
        optimized_similar_cases.append({
            "case_id": sc.get("case_id"),
            "description": sc.get("description"),
            "modus_operandi": sc.get("modus_operandi"),
            "blind_spots": sc.get("blind_spots"),
            "resolution": sc.get("resolution")
        })

    # Serialize case data for the prompt
    new_case_json = json.dumps(new_case, indent=2, default=str)
    similar_cases_json = json.dumps(optimized_similar_cases, indent=2, default=str)

    prompt = _PROMPT_TEMPLATE.format(
        new_case_json=new_case_json,
        similar_cases_json=similar_cases_json,
    )

    # Try models in order, falling back to the next if rate-limited
    response = None
    for attempt, model_name in enumerate(_FALLBACK_MODELS):
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            break
        except Exception as e:
            error_msg = str(e).lower()
            is_rate_limit = any(kw in error_msg for kw in ("quota", "rate", "429", "resource_exhausted", "resource"))

            if is_rate_limit and attempt < len(_FALLBACK_MODELS) - 1:
                logger.warning(f"[Gemini] Rate limited on {model_name}. Switching to next model...")
                time.sleep(2)  # Small delay before trying next model
            elif is_rate_limit:
                # All models exhausted — use local fallback
                logger.warning(f"[Gemini] Rate limit persists across all models. Using fallback analysis for case {new_case.get('case_id', 'unknown')}.")
                return _build_fallback_analysis(new_case, similar_cases)
            else:
                # Non-rate-limit error — also fallback to avoid crashing
                logger.warning(f"[Gemini] Unexpected error on {model_name}: {e}. Using fallback analysis for case {new_case.get('case_id', 'unknown')}.")
                return _build_fallback_analysis(new_case, similar_cases)

    # Extract and parse the JSON from the response
    response_text = response.text.strip()

    # Handle markdown-wrapped JSON (```json ... ```)
    if response_text.startswith("```"):
        lines = response_text.split("\n")
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
