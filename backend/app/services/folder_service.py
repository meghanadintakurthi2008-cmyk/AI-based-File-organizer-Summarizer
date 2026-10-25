import shutil
import time
from pathlib import Path
from sqlalchemy.orm import Session
from ..models import FolderNode, FileRecord, ClusterSuggestion, MetricSnapshot
from ..config import ORGANIZED_DIR

# Initial empty folder directory template (all counts start at 0)
DEFAULT_FOLDERS = [
    {"id": "root-academics", "name": "Academics", "path": "/Academics/", "file_count": 0, "parent_path": None},
    {"id": "fall-2026", "name": "Fall_2026", "path": "/Academics/Fall_2026/", "file_count": 0, "parent_path": "/Academics/"},
    {"id": "ai", "name": "AI", "path": "/Academics/Fall_2026/AI/", "file_count": 0, "parent_path": "/Academics/Fall_2026/"},
    {"id": "dist-sys", "name": "Distributed_Systems", "path": "/Academics/Fall_2026/Distributed_Systems/", "file_count": 0, "parent_path": "/Academics/Fall_2026/"},
    {"id": "quantum", "name": "Quantum_Computing", "path": "/Academics/Fall_2026/Quantum_Computing/", "file_count": 0, "parent_path": "/Academics/Fall_2026/"},
    {"id": "spring-2026", "name": "Spring_2026", "path": "/Academics/Spring_2026/", "file_count": 0, "parent_path": "/Academics/"},
    {"id": "research-archives", "name": "Research_Archives", "path": "/Academics/Research_Archives/", "file_count": 0, "parent_path": "/Academics/"},
    
    {"id": "root-finance", "name": "Finance", "path": "/Finance/", "file_count": 0, "parent_path": None},
    {"id": "invoices", "name": "Invoices_2026", "path": "/Finance/Invoices_2026/", "file_count": 0, "parent_path": "/Finance/"},
    {"id": "taxes", "name": "Tax_Filings", "path": "/Finance/Tax_Filings/", "file_count": 0, "parent_path": "/Finance/"},
    {"id": "payroll", "name": "Payroll_Summaries", "path": "/Finance/Payroll_Summaries/", "file_count": 0, "parent_path": "/Finance/"},

    {"id": "root-legal", "name": "Legal", "path": "/Legal/", "file_count": 0, "parent_path": None},
    {"id": "msa", "name": "Master_Service_Agreements", "path": "/Legal/Master_Service_Agreements/", "file_count": 0, "parent_path": "/Legal/"},
    {"id": "ndas", "name": "NDAs_Signed", "path": "/Legal/NDAs_Signed/", "file_count": 0, "parent_path": "/Legal/"},

    {"id": "root-engineering", "name": "Engineering", "path": "/Engineering/", "file_count": 0, "parent_path": None},
    {"id": "arch-specs", "name": "Architecture_Specs", "path": "/Engineering/Architecture_Specs/", "file_count": 0, "parent_path": "/Engineering/"},
    {"id": "api-docs", "name": "API_Documentation", "path": "/Engineering/API_Documentation/", "file_count": 0, "parent_path": "/Engineering/"},
    {"id": "sprint-backlog", "name": "Sprint_Backlogs", "path": "/Engineering/Sprint_Backlogs/", "file_count": 0, "parent_path": "/Engineering/"},

    {"id": "root-hardware", "name": "Hardware", "path": "/Hardware/", "file_count": 0, "parent_path": None},
    {"id": "circuits", "name": "Circuits", "path": "/Hardware/Circuits/", "file_count": 0, "parent_path": "/Hardware/"},

    {"id": "root-inbox", "name": "Unorganized_Inbox", "path": "/Unorganized_Inbox/", "file_count": 0, "parent_path": None}
]

# No fake cluster suggestions by default
DEFAULT_CLUSTERS = []

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
                    file_count=0,
                    parent_path=item["parent_path"],
                    is_open=1 if item["parent_path"] is None else 0
                )
                db.add(node)
                # Create physical directory in organized folder
                folder_dir = ORGANIZED_DIR / item["path"].strip("/")
                folder_dir.mkdir(parents=True, exist_ok=True)
            db.commit()

        # Recalculate accurate real file counts from database
        FolderService.recalculate_real_counts(db)

    @staticmethod
    def recalculate_real_counts(db: Session):
        """Calculates accurate folder file counts based strictly on real approved files."""
        all_nodes = db.query(FolderNode).all()
        for node in all_nodes:
            # Direct files in this folder that are approved
            direct_count = db.query(FileRecord).filter(
                FileRecord.recommended_folder == node.path,
                FileRecord.status == "approved"
            ).count()
            node.file_count = direct_count
        db.commit()

    @staticmethod
    def get_tree_hierarchy(db: Session) -> list:
        # Ensure counts are up to date
        FolderService.recalculate_real_counts(db)
        
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

        # Physically copy/move file on disk if original file exists
        if file_record.original_path and Path(file_record.original_path).exists():
            target_dir = ORGANIZED_DIR / target_folder.strip("/")
            target_dir.mkdir(parents=True, exist_ok=True)
            target_dest = target_dir / file_record.filename
            try:
                shutil.copy2(file_record.original_path, target_dest)
                file_record.current_path = str(target_dest)
            except Exception:
                pass
        
        # Increment folder counters
        folder = db.query(FolderNode).filter(FolderNode.path == target_folder).first()
        if folder:
            folder.file_count += 1
            curr_parent = folder.parent_path
            while curr_parent:
                p_node = db.query(FolderNode).filter(FolderNode.path == curr_parent).first()
                if p_node:
                    p_node.file_count += 1
                    curr_parent = p_node.parent_path
                else:
                    break

        db.commit()
