import shutil
import time
from pathlib import Path
from sqlalchemy.orm import Session
from ..models import FolderNode, FileRecord, ClusterSuggestion, MetricSnapshot
from ..config import ORGANIZED_DIR

DEFAULT_FOLDERS = [
    {"id": "root-academics", "name": "Academics", "path": "/Academics/", "file_count": 248, "parent_path": None},
    {"id": "fall-2026", "name": "Fall_2026", "path": "/Academics/Fall_2026/", "file_count": 114, "parent_path": "/Academics/"},
    {"id": "ai", "name": "AI", "path": "/Academics/Fall_2026/AI/", "file_count": 42, "parent_path": "/Academics/Fall_2026/"},
    {"id": "dist-sys", "name": "Distributed_Systems", "path": "/Academics/Fall_2026/Distributed_Systems/", "file_count": 38, "parent_path": "/Academics/Fall_2026/"},
    {"id": "quantum", "name": "Quantum_Computing", "path": "/Academics/Fall_2026/Quantum_Computing/", "file_count": 34, "parent_path": "/Academics/Fall_2026/"},
    {"id": "spring-2026", "name": "Spring_2026", "path": "/Academics/Spring_2026/", "file_count": 86, "parent_path": "/Academics/"},
    {"id": "research-archives", "name": "Research_Archives", "path": "/Academics/Research_Archives/", "file_count": 48, "parent_path": "/Academics/"},
    
    {"id": "root-finance", "name": "Finance", "path": "/Finance/", "file_count": 412, "parent_path": None},
    {"id": "invoices", "name": "Invoices_2026", "path": "/Finance/Invoices_2026/", "file_count": 189, "parent_path": "/Finance/"},
    {"id": "taxes", "name": "Tax_Filings", "path": "/Finance/Tax_Filings/", "file_count": 95, "parent_path": "/Finance/"},
    {"id": "payroll", "name": "Payroll_Summaries", "path": "/Finance/Payroll_Summaries/", "file_count": 128, "parent_path": "/Finance/"},

    {"id": "root-legal", "name": "Legal", "path": "/Legal/", "file_count": 164, "parent_path": None},
    {"id": "msa", "name": "Master_Service_Agreements", "path": "/Legal/Master_Service_Agreements/", "file_count": 78, "parent_path": "/Legal/"},
    {"id": "ndas", "name": "NDAs_Signed", "path": "/Legal/NDAs_Signed/", "file_count": 86, "parent_path": "/Legal/"},

    {"id": "root-engineering", "name": "Engineering", "path": "/Engineering/", "file_count": 310, "parent_path": None},
    {"id": "arch-specs", "name": "Architecture_Specs", "path": "/Engineering/Architecture_Specs/", "file_count": 145, "parent_path": "/Engineering/"},
    {"id": "api-docs", "name": "API_Documentation", "path": "/Engineering/API_Documentation/", "file_count": 98, "parent_path": "/Engineering/"},
    {"id": "sprint-backlog", "name": "Sprint_Backlogs", "path": "/Engineering/Sprint_Backlogs/", "file_count": 67, "parent_path": "/Engineering/"},

    {"id": "root-hardware", "name": "Hardware", "path": "/Hardware/", "file_count": 54, "parent_path": None},
    {"id": "circuits", "name": "Circuits", "path": "/Hardware/Circuits/", "file_count": 54, "parent_path": "/Hardware/"},

    {"id": "root-inbox", "name": "Unorganized_Inbox", "path": "/Unorganized_Inbox/", "file_count": 60, "parent_path": None}
]

DEFAULT_CLUSTERS = [
    {
        "id": "cluster-1",
        "topic_name": "Project Silicon",
        "suggested_folder": "/Hardware/Circuits/",
        "detected_count": 12,
        "confidence": 91.0,
        "top_keywords": ["verilog", "fpga-timing", "asic", "clock-domain", "altium"],
        "description": "Detected dense cluster of 12 unorganized circuit schematics, FPGA HDL notes, and gate-level netlists.",
        "sample_files": ["fpga_lattice_pins.txt", "alu_verilog_tb.v", "schematic_bus_v2.png"]
    },
    {
        "id": "cluster-2",
        "topic_name": "Health Insurance & Benefits 2026",
        "suggested_folder": "/HR/Benefits_2026/",
        "detected_count": 8,
        "confidence": 87.0,
        "top_keywords": ["hsa-deductible", "blue-cross", "open-enrollment", "401k-match"],
        "description": "8 policy documents mentioning healthcare premiums, dental coverage, and annual enrollment guides.",
        "sample_files": ["hsa_contribution_limit.pdf", "benefits_faq_2026.docx"]
    },
    {
        "id": "cluster-3",
        "topic_name": "Q3 Marketing Brand Assets",
        "suggested_folder": "/Marketing/Press_Kits/",
        "detected_count": 15,
        "confidence": 84.0,
        "top_keywords": ["brand-guidelines", "svg-vector", "press-release", "keynote"],
        "description": "15 high-res brand logos, pitch decks, and media kit files currently scattered across root folders.",
        "sample_files": ["logo_mark_dark.svg", "press_statement_oct2026.docx"]
    }
]

class FolderService:
    @staticmethod
    def seed_initial_data(db: Session):
        # 1. Folders
        if db.query(FolderNode).count() == 0:
            for item in DEFAULT_FOLDERS:
                node = FolderNode(
                    id=item["id"],
                    name=item["name"],
                    path=item["path"],
                    file_count=item["file_count"],
                    parent_path=item["parent_path"],
                    is_open=1 if item["parent_path"] is None else 0
                )
                db.add(node)
                # Create physical directory in organized folder
                folder_dir = ORGANIZED_DIR / item["path"].strip("/")
                folder_dir.mkdir(parents=True, exist_ok=True)

        # 2. Clusters
        if db.query(ClusterSuggestion).count() == 0:
            for item in DEFAULT_CLUSTERS:
                c = ClusterSuggestion(
                    id=item["id"],
                    topic_name=item["topic_name"],
                    suggested_folder=item["suggested_folder"],
                    detected_count=item["detected_count"],
                    confidence=item["confidence"],
                    top_keywords=item["top_keywords"],
                    description=item["description"],
                    sample_files=item["sample_files"],
                    status="active"
                )
                db.add(c)

        # 3. Metrics
        if db.query(MetricSnapshot).count() == 0:
            m = MetricSnapshot(
                total_analyzed=1248,
                categorization_confidence=94.2,
                auto_sorted_today=342,
                unreadable_flagged=18,
                trend_week="+14.8%",
                target_rate="85.5% automated"
            )
            db.add(m)

        db.commit()

    @staticmethod
    def get_tree_hierarchy(db: Session) -> list:
        all_nodes = db.query(FolderNode).all()
        nodes_by_path = {}
        for n in all_nodes:
            nodes_by_path[n.path] = {
                "id": n.id,
                "name": n.name,
                "path": n.path,
                "fileCount": n.file_count,
                "isOpen": bool(n.is_open),
                "parent_path": n.parent_path,
                "children": []
            }

        root_nodes = []
        for path, node in nodes_by_path.items():
            parent_path = node["parent_path"]
            if parent_path and parent_path in nodes_by_path:
                nodes_by_path[parent_path]["children"].append(node)
            else:
                root_nodes.append(node)

        return root_nodes

    @staticmethod
    def create_folder(db: Session, name: str, parent_path: str = None) -> FolderNode:
        clean_name = name.strip("/").strip()
        if parent_path:
            full_path = f"{parent_path.rstrip('/')}/{clean_name}/"
        else:
            full_path = f"/{clean_name}/"

        existing = db.query(FolderNode).filter(FolderNode.path == full_path).first()
        if existing:
            return existing

        node_id = f"folder-{clean_name.lower()}-{int(time.time())}"
        new_node = FolderNode(
            id=node_id,
            name=clean_name,
            path=full_path,
            parent_path=parent_path,
            file_count=0,
            is_open=0
        )
        db.add(new_node)
        db.commit()
        db.refresh(new_node)

        # Create physical directory
        target_dir = ORGANIZED_DIR / full_path.strip("/")
        target_dir.mkdir(parents=True, exist_ok=True)

        return new_node

    @staticmethod
    def move_file_to_folder(db: Session, file_record: FileRecord, target_folder: str):
        # Update file record
        file_record.recommended_folder = target_folder
        file_record.status = "approved"
        
        # Increment folder counters
        folder = db.query(FolderNode).filter(FolderNode.path == target_folder).first()
        if folder:
            folder.file_count += 1
            # Increment parent folder if present
            curr_parent = folder.parent_path
            while curr_parent:
                p_node = db.query(FolderNode).filter(FolderNode.path == curr_parent).first()
                if p_node:
                    p_node.file_count += 1
                    curr_parent = p_node.parent_path
                else:
                    break

        # Update metrics
        metric = db.query(MetricSnapshot).order_by(MetricSnapshot.id.desc()).first()
        if metric:
            metric.auto_sorted_today += 1
            metric.total_analyzed += 1

        db.commit()
