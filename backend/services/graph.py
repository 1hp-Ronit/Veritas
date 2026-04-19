"""
Veritas — Knowledge Graph Service
Manages the Neo4j graph database for case relationships, evidence, and tags.
The Neo4j driver is initialized once at module level.
"""

import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

# ---------------------------------------------------------------------------
# Initialize Neo4j driver (module-level singleton)
# ---------------------------------------------------------------------------
_neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
_neo4j_user = os.getenv("NEO4J_USERNAME", "neo4j")
_neo4j_password = os.getenv("NEO4J_PASSWORD", "password")
_neo4j_database = os.getenv("NEO4J_DATABASE", None)  # None = use default db

_driver = GraphDatabase.driver(_neo4j_uri, auth=(_neo4j_user, _neo4j_password))


def _close_driver():
    """Close the Neo4j driver (call on app shutdown)."""
    _driver.close()


def ingest_to_graph(case: dict) -> None:
    """
    Ingest a case into the Neo4j knowledge graph.
    - Creates a Case node with core properties.
    - Creates Evidence nodes linked via HAS_EVIDENCE relationships.
    - Creates Tag nodes linked via TAGGED_WITH relationships.
    - Links cases that share tags with SHARES_TAG edges.
    """
    case_id = case.get("case_id", "")
    title = case.get("title", "")
    incident_type = case.get("incident_type", "")
    jurisdiction = case.get("jurisdiction", "")
    modus_operandi = case.get("modus_operandi", "")
    evidence_list = case.get("evidence", [])
    tags = case.get("tags", [])

    with _driver.session(database=_neo4j_database) as session:
        # --- Create or merge the Case node ---
        session.run(
            """
            MERGE (c:Case {case_id: $case_id})
            SET c.title = $title,
                c.incident_type = $incident_type,
                c.jurisdiction = $jurisdiction,
                c.modus_operandi = $modus_operandi
            """,
            case_id=case_id,
            title=title,
            incident_type=incident_type,
            jurisdiction=jurisdiction,
            modus_operandi=modus_operandi,
        )

        # --- Create Evidence nodes and HAS_EVIDENCE relationships ---
        for item in evidence_list:
            evidence_id = item if isinstance(item, str) else item.get("id", str(item))
            evidence_desc = item if isinstance(item, str) else item.get("description", str(item))
            session.run(
                """
                MATCH (c:Case {case_id: $case_id})
                MERGE (e:Evidence {evidence_id: $evidence_id})
                SET e.description = $evidence_desc
                MERGE (c)-[:HAS_EVIDENCE]->(e)
                """,
                case_id=case_id,
                evidence_id=evidence_id,
                evidence_desc=evidence_desc,
            )

        # --- Create Tag nodes and TAGGED_WITH relationships ---
        for tag in tags:
            tag_name = tag.strip() if isinstance(tag, str) else str(tag)
            session.run(
                """
                MATCH (c:Case {case_id: $case_id})
                MERGE (t:Tag {name: $tag_name})
                MERGE (c)-[:TAGGED_WITH]->(t)
                """,
                case_id=case_id,
                tag_name=tag_name,
            )

        # --- Link cases sharing tags with SHARES_TAG edges ---
        session.run(
            """
            MATCH (c1:Case {case_id: $case_id})-[:TAGGED_WITH]->(t:Tag)<-[:TAGGED_WITH]-(c2:Case)
            WHERE c1 <> c2
            MERGE (c1)-[:SHARES_TAG {tag: t.name}]->(c2)
            """,
            case_id=case_id,
        )


def get_case_graph(case_id: str) -> dict:
    """
    Retrieve the subgraph for a given case_id.
    Returns a dict with "nodes" and "edges" lists formatted for React Flow.
    Each node has: {id, type, data: {label, ...properties}}
    Each edge has: {id, source, target, label}
    """
    nodes = []
    edges = []
    seen_nodes = set()
    seen_edges = set()
    edge_counter = 0

    with _driver.session(database=_neo4j_database) as session:
        # --- Fetch the Case node and its immediate relationships ---
        result = session.run(
            """
            MATCH (c:Case {case_id: $case_id})
            OPTIONAL MATCH (c)-[r]->(n)
            RETURN c, r, n, labels(n) AS node_labels, type(r) AS rel_type
            """,
            case_id=case_id,
        )

        for record in result:
            case_node = record["c"]
            related_node = record["n"]
            rel_type = record["rel_type"]
            node_labels = record["node_labels"]

            # Add the case node (once)
            if case_id not in seen_nodes:
                nodes.append({
                    "id": case_id,
                    "type": "case",
                    "data": {
                        "label": case_node.get("title", case_id),
                        **dict(case_node),
                    },
                })
                seen_nodes.add(case_id)

            # Add the related node
            if related_node is not None:
                node_label_type = node_labels[0].lower() if node_labels else "unknown"

                if node_label_type == "evidence":
                    node_id = related_node.get("evidence_id", str(related_node.id))
                elif node_label_type == "tag":
                    node_id = f"tag_{related_node.get('name', str(related_node.id))}"
                elif node_label_type == "case":
                    node_id = related_node.get("case_id", str(related_node.id))
                else:
                    node_id = str(related_node.id)

                if node_id not in seen_nodes:
                    nodes.append({
                        "id": node_id,
                        "type": node_label_type,
                        "data": {
                            "label": related_node.get("name", related_node.get("description", node_id)),
                            **dict(related_node),
                        },
                    })
                    seen_nodes.add(node_id)

                # Add the edge (deduplicated)
                edge_key = (case_id, node_id, rel_type or "")
                if edge_key not in seen_edges:
                    seen_edges.add(edge_key)
                    edge_counter += 1
                    edges.append({
                        "id": f"e{edge_counter}",
                        "source": case_id,
                        "target": node_id,
                        "label": rel_type or "",
                    })

        # --- Fetch SHARES_TAG edges to other cases ---
        shared_result = session.run(
            """
            MATCH (c1:Case {case_id: $case_id})-[r:SHARES_TAG]->(c2:Case)
            RETURN c2, r.tag AS shared_tag
            """,
            case_id=case_id,
        )

        for record in shared_result:
            other_case = record["c2"]
            shared_tag = record["shared_tag"]
            other_id = other_case.get("case_id", str(other_case.id))

            if other_id not in seen_nodes:
                nodes.append({
                    "id": other_id,
                    "type": "case",
                    "data": {
                        "label": other_case.get("title", other_id),
                        **dict(other_case),
                    },
                })
                seen_nodes.add(other_id)

            edge_key = (case_id, other_id, "SHARES_TAG")
            if edge_key not in seen_edges:
                seen_edges.add(edge_key)
                edge_counter += 1
                edges.append({
                    "id": f"e{edge_counter}",
                    "source": case_id,
                    "target": other_id,
                    "label": f"SHARES_TAG ({shared_tag})",
                })

    return {"nodes": nodes, "edges": edges}
