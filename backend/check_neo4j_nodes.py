import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()
_neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
_neo4j_user = os.getenv("NEO4J_USERNAME", "neo4j")
_neo4j_password = os.getenv("NEO4J_PASSWORD", "password")
_neo4j_database = os.getenv("NEO4J_DATABASE", None)

print(f"Connecting to: {_neo4j_uri}")
driver = GraphDatabase.driver(_neo4j_uri, auth=(_neo4j_user, _neo4j_password))

try:
    with driver.session(database=_neo4j_database) as session:
        result = session.run("MATCH (c:Case) RETURN c.case_id LIMIT 10")
        cases = [r["c.case_id"] for r in result]
        print("Cases in graph:", cases)
        
        result2 = session.run("MATCH (n) RETURN count(n) as c")
        print("Total nodes:", result2.single()["c"])
except Exception as e:
    print("Database error:", e)
finally:
    driver.close()
