"""
Veritas — Retriever Service
Manages the ChromaDB vector store for case ingestion and similarity search.
The ChromaDB client and collection are initialized once at module level.
"""

import os
import json
from dotenv import load_dotenv
import chromadb

from services.embedder import embed_combined

load_dotenv()

# ---------------------------------------------------------------------------
# Initialize ChromaDB with local persistence
# ---------------------------------------------------------------------------
_persist_path = os.getenv("CHROMA_PERSIST_PATH", "./chroma_store")
_chroma_client = chromadb.PersistentClient(path=_persist_path)
_collection = _chroma_client.get_or_create_collection(
    name="veritas_cases",
    metadata={"hnsw:space": "cosine"},
)


def ingest_case(case: dict) -> None:
    """
    Ingest a single case into the ChromaDB vector store.
    - Concatenates description + modus_operandi for the text embedding.
    - Uses the suspect sketch image (if sketch_path exists) for image embedding.
    - Stores the full case dict as JSON-serialized metadata.
    - Marks the case as embedded after successful ingestion.
    """
    case_id = case["case_id"]

    # Build text content from description and modus operandi
    text_content = f"{case.get('description', '')} {case.get('modus_operandi', '')}"

    # Check for suspect sketch image
    sketch_path = case.get("sketch_path", None)

    # Generate combined embedding
    embedding = embed_combined(text_content, sketch_path)

    # Serialize the full case dict as metadata (ChromaDB requires string values)
    metadata = {k: json.dumps(v) if isinstance(v, (list, dict)) else str(v) for k, v in case.items()}

    # Upsert into collection (idempotent — safe to re-ingest)
    _collection.upsert(
        ids=[case_id],
        embeddings=[embedding],
        documents=[text_content],
        metadatas=[metadata],
    )

    # Mark case as embedded
    case["embedded"] = True


def retrieve_similar(
    query_text: str,
    query_image_path: str | None = None,
    top_k: int = 10,
) -> list[dict]:
    """
    Find the top_k most similar cases to the given query.
    - Embeds the query using embed_combined (text + optional image).
    - Queries ChromaDB and returns results as a list of metadata dicts.
    - Each returned dict includes a 'similarity_score' (0-100) derived from cosine distance.
    """
    query_embedding = embed_combined(query_text, query_image_path)

    results = _collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["metadatas", "distances"],
    )

    # Parse metadata back from string-serialized JSON where applicable
    cases = []
    if results["metadatas"]:
        distances = results.get("distances", [[]])[0]
        for idx, meta in enumerate(results["metadatas"][0]):
            parsed = {}
            for k, v in meta.items():
                try:
                    parsed[k] = json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    parsed[k] = v
            # Cosine distance → similarity score (0-100)
            dist = distances[idx] if idx < len(distances) else 1.0
            parsed["similarity_score"] = round((1 - dist) * 100, 1)
            cases.append(parsed)

    return cases


def retrieve_similar_ids(
    query_text: str,
    query_image_path: str | None = None,
    top_k: int = 10,
) -> list[dict]:
    """
    Lightweight version that returns just case_ids and similarity scores.
    Used by the graph service to build similarity edges without full metadata.
    """
    query_embedding = embed_combined(query_text, query_image_path)

    results = _collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["metadatas", "distances"],
    )

    cases = []
    if results["metadatas"]:
        distances = results.get("distances", [[]])[0]
        for idx, meta in enumerate(results["metadatas"][0]):
            case_id = meta.get("case_id", "")
            dist = distances[idx] if idx < len(distances) else 1.0
            similarity = round((1 - dist) * 100, 1)
            cases.append({"case_id": case_id, "similarity_score": similarity})

    return cases
