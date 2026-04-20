"""
Veritas — RAG-powered Case Intelligence System
FastAPI entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pathlib

from routes.cases import router as cases_router

app = FastAPI(
    title="Veritas",
    description="RAG-powered case intelligence system for investigators",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS — allow all origins during development (will be restricted later)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Mount static data folder for image serving
# ---------------------------------------------------------------------------
DATA_DIR = pathlib.Path(__file__).parent / "data"
app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")

# ---------------------------------------------------------------------------
# Mount case-related routes under /api/cases
# ---------------------------------------------------------------------------
app.include_router(cases_router, prefix="/api/cases")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/")
async def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "system": "Veritas"}
