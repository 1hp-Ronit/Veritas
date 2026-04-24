import os
import json
import chromadb
from glob import glob
from services.graph import _driver

# 1. Clear Neo4j
print("Connecting to Neo4j...")
with _driver.session() as session:
    session.run("MATCH (n) DETACH DELETE n")
print("Neo4j database cleared.")

# 2. Clear ChromaDB
print("Clearing ChromaDB...")
chroma_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'chroma_store')
if os.path.exists(chroma_path):
    import shutil
    shutil.rmtree(chroma_path)
    print("ChromaDB directory deleted.")
else:
    print("ChromaDB directory not found.")
    
# 3. Reset embedded status in all json files
print("Resetting embedded status in JSON files...")
cases_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'cases')
json_files = glob(os.path.join(cases_dir, '*.json'))
for filepath in json_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            case_data = json.load(f)
        
        if case_data.get('embedded'):
            case_data['embedded'] = False
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(case_data, f, indent=4)
    except Exception as e:
        print(f"Failed to process {filepath}: {e}")
        
print("All `.json` files have been reset.")
print("Database reset complete. Please run backend/scripts/ingest_cases.py to re-ingest data!")
