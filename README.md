# Veritas — RAG-Powered Case Intelligence System

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Neo4j-5.27-008CC1?logo=neo4j&logoColor=white" alt="Neo4j" />
  <img src="https://img.shields.io/badge/ChromaDB-0.6-FF6F00" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
</p>

**Veritas** is a full-stack investigative case intelligence platform designed for law enforcement and investigators. It uses Retrieval-Augmented Generation (RAG) to find patterns, generate leads, and uncover blind spots by cross-referencing new case data against a knowledge base of historically resolved cases. 

---

## 🎯 Key Features

- **Multimodal RAG Engine**: Uses text embeddings (Sentence Transformers) and image embeddings (OpenAI CLIP) to perform semantic searches across historical cases, matching crime descriptions, M.O., and evidence imagery.
- **AI-Powered Case Analysis**: Integrates with Google Gemini to generate ranked investigative leads, identify potential blind spots, and summarize case connections.
- **Evidence Knowledge Graph**: Visualizes case relationships dynamically using Neo4j and React Flow. It connects cases based on shared tags, evidence, and RAG semantic similarity.
- **Secure Authentication**: Protected access via Supabase Authentication.

---

## 🏗️ Architecture & Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Vector Database**: ChromaDB (Local persistent storage for semantic similarity matching)
- **Knowledge Graph**: Neo4j (Graph database for tracking case links and tags)
- **Embeddings**: Sentence Transformers (`all-MiniLM-L6-v2`) & OpenAI CLIP (`clip-vit-base-patch32`)
- **LLM**: Google Gemini 2.5 Flash

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS
- **Graph Visualization**: React Flow (`@xyflow/react`)
- **Authentication**: Supabase Auth

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & npm
- **Neo4j Database** (Local Desktop/Docker or [Neo4j Aura](https://neo4j.com/cloud/aura/) free tier)
- **Google Gemini API Key** (Get it from [Google AI Studio](https://aistudio.google.com/apikey))
- **Supabase Project** (For authentication)

### 1. Clone the Repository
```bash
git clone https://github.com/1hp-Ronit/Veritas.git
cd Veritas
```

### 2. Backend Setup
Navigate to the `backend` directory, create a virtual environment, and install dependencies.
```bash
cd backend
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (macOS/Linux)
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```bash
cp .env.example .env
```
Fill in the environment variables:
```env
GEMINI_API_KEY=your_gemini_api_key
NEO4J_URI=bolt://localhost:7687  # or your Aura DB URI
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j
CHROMA_PERSIST_PATH=./chroma_store
```

### 3. Frontend Setup
Navigate to the `frontend` directory and install dependencies.
```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend` directory for Supabase authentication:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Initialization & Seeding
Before using the application, you need to seed the ChromaDB and Neo4j databases with historical case data. Ensure your Neo4j instance is running.

```bash
cd ../backend

# (Optional) Clear existing databases before seeding
python -m scripts.reset_db

# Ingest the seed cases into ChromaDB and Neo4j
python -m scripts.ingest_cases
```

### 5. Running the Application
Start the backend server:
```bash
cd backend
uvicorn main:app --reload
# API available at http://localhost:8000
```

In a new terminal, start the frontend development server:
```bash
cd frontend
npm run dev
# UI available at http://localhost:5173
```

---

## 📖 Usage Guide

1. **Login**: Access the application via the Supabase login screen.
2. **Case Input**: Fill out a new case report, detailing the incident type, description, and Modus Operandi (M.O.). Upload suspect sketches or crime scene evidence.
3. **Run Retrieval**: The system will embed your input, retrieve the top structurally and semantically similar cases from ChromaDB, and feed them to Gemini.
4. **View Results**: Review the AI's ranked leads and blind spots. You can see exactly which historical cases were matched and their similarity confidence scores.
5. **Explore Evidence Graph**: Open the graph viewer to see a visual node-edge network of the current case connected to past cases via shared patterns, tags, and semantic similarities.


'Made with love for GDG Solutions - Build with AI'