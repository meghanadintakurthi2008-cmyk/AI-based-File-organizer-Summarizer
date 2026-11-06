import shutil
import time
import zipfile
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models import FolderNode, FileRecord
from ..config import ORGANIZED_DIR, STORAGE_DIR
from .classifier import CATEGORY_DEFINITIONS

# 11 Clean Type-Based Folders matching the 11 required file categories with 0 initial files
DEFAULT_FOLDERS = [
    {"id": "fld-pdf", "name": "PDF Files", "path": "PDF Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-word", "name": "Word Files", "path": "Word Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-excel", "name": "Excel Files", "path": "Excel Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-ppt", "name": "PowerPoint Files", "path": "PowerPoint Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-image", "name": "Image Files", "path": "Image Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-video", "name": "Video Files", "path": "Video Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-audio", "name": "Audio Files", "path": "Audio Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-text", "name": "Text Files", "path": "Text Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-code", "name": "Code Files", "path": "Code Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-archive", "name": "Archive Files", "path": "Archive Files/", "file_count": 0, "parent_path": None, "is_custom": 0},
    {"id": "fld-other", "name": "Other Files", "path": "Other Files/", "file_count": 0, "parent_path": None, "is_custom": 0}
]

class FolderService:
    @staticmethod
    def seed_initial_data(db: Session):
        if db.query(FolderNode).count() == 0:
            for item in DEFAULT_FOLDERS:
                node = FolderNode(
                    id=item["id"],
                    name=item["name"],
                    path=item["path"],
                    file_count=0,
                    parent_path=item["parent_path"],
                    is_open=1,
                    is_custom=0
                )
                db.add(node)
                # Create physical directory
                folder_dir = ORGANIZED_DIR / item["path"].strip("/")
                folder_dir.mkdir(parents=True, exist_ok=True)
            db.commit()

        FolderService.recalculate_real_counts(db)

    @staticmethod
    def recalculate_real_counts(db: Session):
        """
        Calculates accurate folder file counts using uploaded file records as single source of truth.
        - For default category folders (PDF Files, Word Files, etc.):
          Counts all active uploaded files whose detected file type matches the category.
        - For user-created custom folders:
          Counts all active files assigned to that custom folder.
        """
        all_nodes = db.query(FolderNode).all()
        for node in all_nodes:
            if getattr(node, "is_custom", 0) == 1:
                # Custom folder: count active files assigned to this folder path
                count = db.query(FileRecord).filter(
                    FileRecord.recommended_folder == node.path,
                    FileRecord.status != "dismissed"
                ).count()
            else:
                # Default file-type category folder: count all active files detected as this type
                count = db.query(FileRecord).filter(
                    (FileRecord.predicted_category == node.name) | (FileRecord.recommended_folder == node.path),
                    FileRecord.status != "dismissed"
                ).count()
            node.file_count = count
        db.commit()

    @staticmethod
    def get_tree_hierarchy(db: Session) -> list:
        FolderService.recalculate_real_counts(db)
        all_nodes = db.query(FolderNode).order_by(FolderNode.is_custom.asc(), FolderNode.name.asc()).all()
        nodes = []
        for n in all_nodes:
            nodes.append({
                "id": n.id,
                "name": n.name,
                "path": n.path,
                "fileCount": n.file_count,
                "isOpen": bool(n.is_open),
                "isCustom": bool(getattr(n, "is_custom", 0)),
                "parentPath": n.parent_path,
                "children": []
            })
        return nodes

    @staticmethod
    def create_folder(db: Session, name: str, parent_path: Optional[str] = None, is_custom: bool = True) -> FolderNode:
        clean_name = name.strip("/").strip()
        if not clean_name:
            raise ValueError("Folder name cannot be blank")

        if parent_path and parent_path.strip("/") and parent_path.strip("/") != "None":
            clean_parent = parent_path.strip("/")
            full_path = f"{clean_parent}/{clean_name}/"
            parent_clean = f"{clean_parent}/"
        else:
            full_path = f"{clean_name}/"
            parent_clean = None

        existing = db.query(FolderNode).filter(FolderNode.path == full_path).first()
        if existing:
            return existing

        node_id = f"fld-{clean_name.lower().replace(' ', '-')}-{int(time.time() * 1000) % 1000000}"
        new_node = FolderNode(
            id=node_id,
            name=clean_name,
            path=full_path,
            parent_path=parent_clean,
            file_count=0,
            is_open=1,
            is_custom=1 if is_custom else 0
        )
        db.add(new_node)
        db.commit()
        db.refresh(new_node)

        target_dir = ORGANIZED_DIR / full_path.strip("/")
        target_dir.mkdir(parents=True, exist_ok=True)

        return new_node

    @staticmethod
    def rename_folder(db: Session, folder_id: str, new_name: str) -> FolderNode:
        clean_new_name = new_name.strip("/").strip()
        if not clean_new_name:
            raise ValueError("New folder name cannot be blank")

        folder = db.query(FolderNode).filter(FolderNode.id == folder_id).first()
        if not folder:
            raise ValueError("Folder not found")

        if getattr(folder, "is_custom", 0) == 0:
            raise ValueError("Cannot rename default file-type categories")

        old_path = folder.path
        if folder.parent_path:
            new_path = f"{folder.parent_path.strip('/')}/{clean_new_name}/"
        else:
            new_path = f"{clean_new_name}/"

        if old_path == new_path:
            return folder

        # Rename physical directory if exists
        old_dir = ORGANIZED_DIR / old_path.strip("/")
        new_dir = ORGANIZED_DIR / new_path.strip("/")
        if old_dir.exists():
            try:
                new_dir.parent.mkdir(parents=True, exist_ok=True)
                if not new_dir.exists():
                    shutil.move(str(old_dir), str(new_dir))
                else:
                    for item in old_dir.iterdir():
                        dest_item = new_dir / item.name
                        if item.is_file():
                            shutil.copy2(str(item), str(dest_item))
                    shutil.rmtree(str(old_dir), ignore_errors=True)
            except Exception:
                new_dir.mkdir(parents=True, exist_ok=True)
        else:
            new_dir.mkdir(parents=True, exist_ok=True)

        # Update all files referencing old_path
        files_to_update = db.query(FileRecord).filter(FileRecord.recommended_folder == old_path).all()
        for f in files_to_update:
            f.recommended_folder = new_path
            if f.current_path and old_path.strip("/") in f.current_path:
                f.current_path = f.current_path.replace(old_path.strip("/"), new_path.strip("/"))

        # Update child folders
        child_folders = db.query(FolderNode).filter(FolderNode.parent_path == old_path).all()
        for child in child_folders:
            child.parent_path = new_path
            child.path = f"{new_path.strip('/')}/{child.name}/"

        folder.name = clean_new_name
        folder.path = new_path
        db.commit()
        db.refresh(folder)
        FolderService.recalculate_real_counts(db)
        return folder

    @staticmethod
    def delete_folder(db: Session, folder_id: str, move_to_folder: Optional[str] = "Other Files/"):
        folder = db.query(FolderNode).filter(FolderNode.id == folder_id).first()
        if not folder:
            raise ValueError("Folder not found")

        if getattr(folder, "is_custom", 0) == 0:
            raise ValueError("Cannot delete default system folders")

        # Check files inside
        files = db.query(FileRecord).filter(FileRecord.recommended_folder == folder.path).all()
        safe_destination = (move_to_folder and move_to_folder.strip()) or "Other Files/"
        if not safe_destination.endswith("/"):
            safe_destination = f"{safe_destination}/"

        # Ensure destination folder exists in DB
        dest_node = db.query(FolderNode).filter(FolderNode.path == safe_destination).first()
        if not dest_node and safe_destination != "Other Files/":
            dest_node = db.query(FolderNode).filter(FolderNode.path == "Other Files/").first()
            safe_destination = "Other Files/"

        dest_dir = ORGANIZED_DIR / safe_destination.strip("/")
        dest_dir.mkdir(parents=True, exist_ok=True)

        for f in files:
            # Reassign file
            f.recommended_folder = safe_destination
            if f.current_path and Path(f.current_path).exists():
                src_file = Path(f.current_path)
                target_file = dest_dir / src_file.name
                # Avoid collision
                if target_file.exists() and str(target_file) != str(src_file):
                    stem = src_file.stem
                    suffix = src_file.suffix
                    c = 1
                    while (dest_dir / f"{stem} ({c}){suffix}").exists():
                        c += 1
                    target_file = dest_dir / f"{stem} ({c}){suffix}"
                try:
                    shutil.move(str(src_file), str(target_file))
                    f.current_path = str(target_file)
                except Exception as e:
                    print(f"Error moving file during folder deletion: {e}")

        # Delete physical directory
        folder_dir = ORGANIZED_DIR / folder.path.strip("/")
        if folder_dir.exists():
            shutil.rmtree(folder_dir, ignore_errors=True)

        # Remove folder node from DB
        db.delete(folder)
        db.commit()
        FolderService.recalculate_real_counts(db)
        return {"success": True, "deletedFolderId": folder_id, "movedFilesCount": len(files), "targetFolder": safe_destination}

    @staticmethod
    def get_folder_files(db: Session, folder_id: str) -> List[dict]:
        clean_id = folder_id.strip()
        folder = db.query(FolderNode).filter(
            (FolderNode.id == clean_id) |
            (FolderNode.path == clean_id) |
            (FolderNode.name == clean_id) |
            (FolderNode.path == f"{clean_id}/")
        ).first()

        if not folder:
            clean_name = clean_id.strip("/").strip()
            folder = db.query(FolderNode).filter(FolderNode.name.ilike(clean_name)).first()
            if not folder:
                raise ValueError(f"Folder '{folder_id}' not found")

        if getattr(folder, "is_custom", 0) == 1:
            records = db.query(FileRecord).filter(
                FileRecord.recommended_folder == folder.path,
                FileRecord.status != "dismissed"
            ).order_by(FileRecord.created_at.desc()).all()
        else:
            records = db.query(FileRecord).filter(
                (FileRecord.predicted_category == folder.name) | (FileRecord.recommended_folder == folder.path),
                FileRecord.status != "dismissed"
            ).order_by(FileRecord.created_at.desc()).all()

        results = []
        for r in records:
            cat_meta = CATEGORY_DEFINITIONS.get(r.predicted_category, {})
            results.append({
                "id": r.id,
                "name": r.filename,
                "size": r.size_display,
                "format": r.format,
                "category": r.predicted_category,
                "status": r.status,
                "folder": r.recommended_folder,
                "summarizable": cat_meta.get("summarizable", True),
                "timestamp": r.created_at.strftime("%b %d, %H:%M") if r.created_at else "Just now"
            })
        return results

    @staticmethod
    def move_file_to_folder(db: Session, file_record: FileRecord, target_folder: str) -> str:
        """
        Organizes the file safely into the target folder (default or custom).
        - Never deletes files.
        - Safely handles duplicate filenames by appending (1), (2), etc.
        """
        clean_folder = target_folder.strip()
        if not clean_folder.endswith("/"):
            clean_folder = f"{clean_folder}/"

        file_record.recommended_folder = clean_folder
        file_record.status = "approved"

        final_filename = file_record.filename

        if file_record.original_path and Path(file_record.original_path).exists():
            target_dir = ORGANIZED_DIR / clean_folder.strip("/")
            target_dir.mkdir(parents=True, exist_ok=True)
            
            target_dest = target_dir / file_record.filename

            # Safe duplicate handling: never overwrite or delete existing files
            if target_dest.exists():
                stem = Path(file_record.filename).stem
                suffix = Path(file_record.filename).suffix
                counter = 1
                while (target_dir / f"{stem} ({counter}){suffix}").exists():
                    counter += 1
                final_filename = f"{stem} ({counter}){suffix}"
                target_dest = target_dir / final_filename
                file_record.filename = final_filename

            try:
                shutil.copy2(file_record.original_path, target_dest)
                file_record.current_path = str(target_dest)
            except Exception as e:
                print(f"Error copying file: {e}")

        # Update folder counters
        FolderService.recalculate_real_counts(db)
        return final_filename

    @staticmethod
    def create_organized_zip(db: Session) -> Path:
        """
        Packages all organized files from both default and user-created custom folders into a clean ZIP archive.
        Preserves folder hierarchy e.g.
        SmartFolder_Organized/
          PDF Files/
          Word Files/
          My College Notes/
          Semester 3/
        Returns the path to the created zip file.
        """
        zip_path = STORAGE_DIR / "SmartFolder_Organized.zip"
        
        # Build zip with relative directory structure
        seen_arcnames = set()
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            files_to_pack = db.query(FileRecord).filter(FileRecord.status == "approved").all()
            if not files_to_pack:
                files_to_pack = db.query(FileRecord).filter(FileRecord.status != "dismissed").all()
            for rec in files_to_pack:
                folder_prefix = f"SmartFolder_Organized/{rec.recommended_folder.strip('/')}"
                source_path = None
                filename = rec.filename

                if rec.current_path and Path(rec.current_path).exists():
                    source_path = rec.current_path
                    filename = Path(rec.current_path).name
                elif rec.original_path and Path(rec.original_path).exists():
                    source_path = rec.original_path

                if source_path:
                    arcname = f"{folder_prefix}/{filename}"
                    # Ensure duplicate safety in zip
                    if arcname in seen_arcnames:
                        stem = Path(filename).stem
                        suffix = Path(filename).suffix
                        counter = 1
                        while f"{folder_prefix}/{stem} ({counter}){suffix}" in seen_arcnames:
                            counter += 1
                        arcname = f"{folder_prefix}/{stem} ({counter}){suffix}"
                    seen_arcnames.add(arcname)
                    zf.write(source_path, arcname=arcname)

        return zip_path
