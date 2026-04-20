"""
Veritas — Case Routes
API endpoints for submitting, ingesting, resolving cases and querying the graph.
"""

import os
import shutil
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from pydantic import BaseModel

from services.retriever import ingest_case, retrieve_similar
from services.graph import ingest_to_graph, get_case_graph
from services.analyzer import analyze_case

router = APIRouter()

# Base directory for storing uploaded case files
_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "cases"


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------
class IngestRequest(BaseModel):
    """JSON body for the /ingest endpoint — matches the full case schema."""
    case_id: str
    title: str = ""
    jurisdiction: str = ""
    incident_type: str = ""
    description: str = ""
    modus_operandi: str = ""
    tags: list[str] = []
    evidence: list = []
    sketch_path: str | None = None
    embedded: bool = False


class ResolveRequest(BaseModel):
    """JSON body for the /resolve endpoint."""
    case_id: str


# ---------------------------------------------------------------------------
# POST /submit — Submit a new case for analysis
# ---------------------------------------------------------------------------
@router.post("/submit")
async def submit_case(
    case_id: str = Form(...),
    title: str = Form(""),
    jurisdiction: str = Form(""),
    incident_type: str = Form(""),
    description: str = Form(""),
    modus_operandi: str = Form(""),
    tags: str = Form(""),
    image: UploadFile | None = File(None),
):
    """
    Accept a new case via multipart form data.
    - Saves the uploaded suspect sketch image (if provided).
    - Retrieves structurally similar resolved cases from the vector store.
    - Sends the new case + similar cases to Gemini for analysis.
    - Returns the full analysis response (leads, blind spots, summary).
    """
    # Parse comma-separated tags into a list
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    # Handle optional image upload
    sketch_path = None
    if image and image.filename:
        case_dir = _DATA_DIR / case_id
        case_dir.mkdir(parents=True, exist_ok=True)
        sketch_path = str(case_dir / image.filename)
        with open(sketch_path, "wb") as f:
            shutil.copyfileobj(image.file, f)

    # Build the case dict
    case = {
        "case_id": case_id,
        "title": title,
        "jurisdiction": jurisdiction,
        "incident_type": incident_type,
        "description": description,
        "modus_operandi": modus_operandi,
        "tags": tag_list,
        "sketch_path": sketch_path,
        "evidence": [],
    }

    if sketch_path:
        case["evidence"].append({"id": f"img-{case_id}", "description": f"Uploaded Evidence File / Sketch"})

    # Retrieve similar resolved cases from ChromaDB
    query_text = f"{description} {modus_operandi}"
    similar_cases = retrieve_similar(query_text, sketch_path)

    # Analyze with Gemini
    analysis = analyze_case(case, similar_cases)

    # Safely ingest the current case into the graph database
    # This automatically tracks shared tags with historical cases.
    try:
        ingest_to_graph(case)
    except Exception as e:
        print(f"[Neo4j] Warning — could not graph new case {case_id}: {e}")

    # Process similar cases to include a routable preview URL
    safe_similar_cases = []
    for sc in similar_cases:
        sc_copy = dict(sc)
        sp = sc_copy.get("sketch_path")
        # ChromaDB stringifies None to "None", so we must explicitly check string literals
        if sp and str(sp).lower() not in ["none", "null", "", "false"]:
            try:
                sc_path = Path(sp)
                if sc_path.is_absolute():
                    rel = sc_path.relative_to(_DATA_DIR.parent)
                    sc_copy["preview_url"] = f"/data/{rel.as_posix()}"
                else:
                    # if it's already relative e.g., ./data/cases/...
                    clean_path = str(sc_path).replace("\\", "/").lstrip("./")
                    if clean_path.startswith("data/"):
                        sc_copy["preview_url"] = f"/{clean_path}"
                    else:
                        sc_copy["preview_url"] = f"/data/{clean_path}"
            except Exception:
                sc_copy["preview_url"] = None
        else:
            sc_copy["preview_url"] = None
        safe_similar_cases.append(sc_copy)

    return {
        "case_id": case_id,
        "analysis": analysis,
        "similar_cases_count": len(similar_cases),
        "similar_cases": safe_similar_cases,
    }


# ---------------------------------------------------------------------------
# POST /ingest — Ingest a resolved case into vector store + knowledge graph
# ---------------------------------------------------------------------------
@router.post("/ingest")
async def ingest(request: IngestRequest):
    """
    Ingest a resolved case into both ChromaDB (vector store) and Neo4j (graph).
    Accepts a JSON body matching the case schema.
    """
    case = request.model_dump()

    try:
        ingest_case(case)
        ingest_to_graph(case)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    return {"status": "ingested", "case_id": request.case_id}


# ---------------------------------------------------------------------------
# GET /graph/{case_id} — Retrieve the knowledge graph for a case
# ---------------------------------------------------------------------------
@router.get("/graph/{case_id}")
async def graph(case_id: str):
    """
    Fetch the subgraph (nodes + edges) for a given case_id from Neo4j.
    Returns data formatted for React Flow consumption on the frontend.
    """
    try:
        result = get_case_graph(case_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph query failed: {str(e)}")

    return result


# ---------------------------------------------------------------------------
# POST /resolve — Mark a case as resolved and re-ingest it
# ---------------------------------------------------------------------------
@router.post("/resolve")
async def resolve(request: ResolveRequest):
    """
    Re-ingest a case into ChromaDB and Neo4j (e.g., after it has been resolved
    with additional evidence or corrections).
    """
    case_id = request.case_id

    # Build a minimal case dict — in production this would be fetched from a DB
    case = {
        "case_id": case_id,
        "embedded": False,
    }

    try:
        ingest_case(case)
        ingest_to_graph(case)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resolve failed: {str(e)}")

    return {"status": "resolved", "case_id": case_id}
