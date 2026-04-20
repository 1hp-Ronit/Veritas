"""
Veritas — Batch Case Ingestion Script
Reads all .json files from backend/data/cases/ and ingests each case
into ChromaDB (vector store) and Neo4j (knowledge graph).

Usage:
    cd backend
    python -m scripts.ingest_cases
"""

import json
import os
import sys
from pathlib import Path

# Ensure the backend directory is on the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.retriever import ingest_case
from services.graph import ingest_to_graph


def main():
    """
    Walk through all .json files in data/cases/, parse each one,
    and ingest into ChromaDB + Neo4j.
    Skips files where the case is already marked as embedded.
    """
    cases_dir = Path(__file__).resolve().parent.parent / "data" / "cases"

    if not cases_dir.exists():
        print(f"Cases directory not found: {cases_dir}")
        return

    json_files = sorted(cases_dir.glob("*.json"))

    if not json_files:
        print("No .json case files found in data/cases/")
        return

    print(f"Found {len(json_files)} case file(s). Starting ingestion...\n")

    for filepath in json_files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                case = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"  SKIP (parse error): {filepath.name} — {e}")
            continue

        # Skip cases that have already been embedded
        if case.get("embedded", False):
            print(f"  SKIP (already embedded): {case.get('case_id', filepath.name)}")
            continue

        case_id = case.get("case_id", filepath.stem)

        # --- Ingest into ChromaDB vector store ---
        try:
            ingest_case(case)
            print(f"  [ChromaDB] Ingested: {case_id}")
        except Exception as e:
            print(f"  [ChromaDB] ERROR on {case_id}: {e}")
            continue

        # Mark as embedded and save back to the JSON file
        try:
            case["embedded"] = True
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(case, f, indent=2, ensure_ascii=False)
            print(f"  [File]     Marked as embedded: {filepath.name}")
        except IOError as e:
            print(f"  [File]     WARNING — could not update {filepath.name}: {e}")

        # --- Ingest into Neo4j knowledge graph ---
        try:
            ingest_to_graph(case)
            print(f"  [Neo4j]    Ingested: {case_id}")
        except Exception as e:
            print(f"  [Neo4j]    WARNING — skipped {case_id}: {e}")
            print(f"             (Is Neo4j running on {os.getenv('NEO4J_URI', 'bolt://localhost:7687')}?)")

    print("\nIngestion complete.")


if __name__ == "__main__":
    main()
