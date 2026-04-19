# Veritas — RAG-Powered Case Intelligence System

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Neo4j-5.27-008CC1?logo=neo4j&logoColor=white" />
  <img src="https://img.shields.io/badge/ChromaDB-0.6-FF6F00" />
</p>

**Veritas** is a full-stack investigative case intelligence platform that uses Retrieval-Augmented Generation (RAG) to help investigators find patterns, generate leads, and uncover blind spots by cross-referencing new cases against a knowledge base of historically resolved cases.

> Built for the **Google Developer Groups (GDG) Solutions Hackathon 2026**.

---

## How It Works

```
New Case Submission
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  1. EMBED — Sentence Transformers + CLIP            │
│     Text (description + MO) → 384-dim vector        │
│     Image (suspect sketch)  → 512-dim vector (CLIP) │
│     Combined → averaged & normalized                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  2. RETRIEVE — ChromaDB (cosine similarity)         │
│     Query the vector store with the combined         │
│     embedding → top-5 structurally similar cases     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  3. AUGMENT + GENERATE — Google Gemini 2.5 Flash    │
│     Inject retrieved cases into prompt context       │
│     → Ranked investigative leads                     │
│     → Blind spot checklist                           │
│     → AI-generated case summary                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  4. GRAPH — Neo4j Knowledge Graph                   │
│     Cases ←→ Tags ←→ Evidence                        │
│     SHARES_TAG edges link cases with common patterns │
│     Visualized as interactive network in React Flow  │
└─────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---|---|
| **Multimodal RAG** | Text embeddings (Sentence Transformers) + image embeddings (CLIP) fused into a single retrieval vector |
| **AI-Powered Analysis** | Gemini 2.5 Flash generates ranked leads, blind-spot checklists, and summaries |
| **Knowledge Graph** | Neo4j stores case relationships — shared tags, evidence links, pattern overlaps |
| **Interactive Evidence Graph** | React Flow visualization with radial layout, node click details, fullscreen mode |
| **Pattern Matching** | Clickable match count reveals which historical cases were linked and why |
| **Case Ingestion Pipeline** | Batch script to ingest resolved cases into both ChromaDB and Neo4j |

---

## Tech Stack

### Backend
| Component | Technology |
|---|---|
| API Framework | **FastAPI** (Python 3.11+) |
| Vector Database | **ChromaDB** (local persistent storage) |
| Knowledge Graph | **Neo4j** (Aura or self-hosted) |
| Text Embeddings | **Sentence Transformers** (`all-MiniLM-L6-v2`, 384-dim) |
| Image Embeddings | **OpenAI CLIP** (`clip-vit-base-patch32`, 512-dim) |
| LLM | **Google Gemini 2.5 Flash** |

### Frontend
| Component | Technology |
|---|---|
| Framework | **React 19** (Vite) |
| Styling | **Tailwind CSS** |
| Graph Visualization | **React Flow** (`@xyflow/react`) |
| Icons | **Lucide React** |
| HTTP Client | **Axios** |

---

## Project Structure

```
Veritas/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment variable template
│   ├── routes/
│   │   └── cases.py               # API endpoints (submit, ingest, graph, resolve)
│   ├── services/
│   │   ├── analyzer.py            # Gemini LLM analysis (prompt + parse)
│   │   ├── embedder.py            # Text + image embedding (ST + CLIP)
│   │   ├── retriever.py           # ChromaDB vector store operations
│   │   └── graph.py               # Neo4j knowledge graph operations
│   ├── scripts/
│   │   └── ingest_cases.py        # Batch ingestion of resolved cases
│   └── data/
│       └── cases/                 # JSON case files (15 seed cases)
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                # Router setup
│       ├── index.css              # Global styles + Tailwind layers
│       ├── api/
│       │   └── client.js          # Axios instance (baseURL → backend)
│       ├── components/
│       │   └── Navbar.jsx         # Navigation bar with accent stripe
│       └── pages/
│           ├── CaseInput.jsx      # New case submission form
│           ├── Results.jsx        # AI analysis results + match details
│           └── EvidenceGraph.jsx  # Interactive knowledge graph viewer
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Neo4j** database (local or [Neo4j Aura](https://neo4j.com/cloud/aura/) free tier)
- **Google Gemini API key** ([AI Studio](https://aistudio.google.com/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/1hp-Ronit/Veritas.git
cd Veritas
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file (copy from the template):

```bash
cp .env.example .env
```

Fill in your credentials:

```env
GEMINI_API_KEY=your_gemini_api_key
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j
CHROMA_PERSIST_PATH=./chroma_store
```

### 3. Ingest Seed Cases

The project ships with 15 resolved case files in `backend/data/cases/`. Ingest them into ChromaDB and Neo4j:

```bash
cd backend
python -m scripts.ingest_cases
```

### 4. Start the Backend

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/cases/submit` | Submit a new case (multipart form) → returns AI analysis |
| `POST` | `/api/cases/ingest` | Ingest a resolved case into vector store + graph (JSON) |
| `GET` | `/api/cases/graph/{case_id}` | Fetch the knowledge subgraph for a case (React Flow format) |
| `POST` | `/api/cases/resolve` | Re-ingest a case after resolution |

---

## Screenshots

### Case Input
The investigator fills in case details — ID, incident type (24 categories), jurisdiction, description, MO, tags, and optionally uploads suspect sketches or crime scene photos.

### Results
AI-generated ranked investigative leads with priority badges (High/Mid/Low), confidence scores, blind spot checklists, and a full summary. The match count badge is clickable, revealing which historical cases were linked and why.

### Evidence Graph
Interactive radial network graph powered by React Flow. Nodes represent cases, tags, and evidence items. Edges show `TAGGED_WITH`, `HAS_EVIDENCE`, and `SHARES_TAG` relationships. Clicking any node reveals a detail popup. Fullscreen mode is supported.

---

## Case Data Schema

Each case JSON file follows this structure:

```json
{
  "case_id": "CIS-2020-DEL-12",
  "title": "Lajpat Nagar Jewellery Heist",
  "date_of_incident": "2020-03-22",
  "jurisdiction": "New Delhi",
  "incident_type": "Armed Robbery",
  "description": "Three armed suspects raided a jewellery store...",
  "modus_operandi": "Three-person team, one tech disabler, two looters...",
  "evidence": [
    { "id": "E-01", "type": "cctv", "description": "Exterior camera caught suspects..." }
  ],
  "tags": ["armed-robbery", "three-person-team", "cctv-disabled"],
  "embedded": false
}
```

---

## Roadmap

- [x] **v0.1** — Core RAG pipeline (ChromaDB + Gemini + Neo4j)
- [x] **v0.1** — React frontend with case submission, results, and evidence graph
- [x] **v0.1** — Multimodal embeddings (text + CLIP image fusion)
- [x] **v0.1** — Batch ingestion script with 15 seed cases
- [ ] **v0.2** — Google Cloud Storage (GCS) for image and data storage
- [ ] **v0.2** — Deployment on Google Cloud Run (containerized)
- [ ] **v0.3** — Case timeline visualization
- [ ] **v0.3** — Suspect sketch comparison using CLIP similarity

---

## License

This project was built for the GDG Solutions Hackathon 2026. See repository for license details.

---

<p align="center">
  <strong>Veritas</strong> — <em>Truth through pattern recognition</em>
</p>
