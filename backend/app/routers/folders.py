from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import FolderNode
from ..schemas import (
    FolderTreeNode, 
    CreateFolderRequest, 
    RenameFolderRequest, 
    DeleteFolderRequest,
    FolderFileItem
)
from ..services.folder_service import FolderService

router = APIRouter(prefix="/folders", tags=["Directory Tree"])

@router.get("/tree")
def get_folder_tree(db: Session = Depends(get_db)):
    tree = FolderService.get_tree_hierarchy(db)
    return tree

@router.post("", response_model=FolderTreeNode)
def create_folder(payload: CreateFolderRequest, db: Session = Depends(get_db)):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Folder name cannot be blank")

    try:
        node = FolderService.create_folder(db, payload.name, payload.parentPath, is_custom=True)
        result = FolderTreeNode(
            id=node.id,
            name=node.name,
            path=node.path,
            fileCount=node.file_count,
            isOpen=bool(node.is_open),
            isCustom=bool(getattr(node, "is_custom", 0)),
            parentPath=node.parent_path,
            children=[]
        )
        try:
            from ..services.activity_service import ActivityService
            ActivityService.log(
                db=db,
                activity_type="folder_create",
                description=f"Created folder: {payload.name}",
                folder_to=node.path
            )
        except Exception as e:
            print(f"Activity log error: {e}")
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{folder_id}/rename", response_model=FolderTreeNode)
def rename_folder(
    folder_id: str,
    payload: RenameFolderRequest,
    db: Session = Depends(get_db)
):
    if not payload.newName.strip():
        raise HTTPException(status_code=400, detail="Folder name cannot be blank")

    try:
        updated = FolderService.rename_folder(db, folder_id, payload.newName)
        return FolderTreeNode(
            id=updated.id,
            name=updated.name,
            path=updated.path,
            fileCount=updated.file_count,
            isOpen=bool(updated.is_open),
            isCustom=bool(getattr(updated, "is_custom", 0)),
            parentPath=updated.parent_path,
            children=[]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{folder_id}")
def delete_folder(
    folder_id: str,
    moveToFolder: Optional[str] = Query("Other Files/"),
    db: Session = Depends(get_db)
):
    try:
        res = FolderService.delete_folder(db, folder_id, move_to_folder=moveToFolder)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{folder_id}/files", response_model=List[FolderFileItem])
def get_folder_files(folder_id: str, db: Session = Depends(get_db)):
    try:
        files = FolderService.get_folder_files(db, folder_id)
        return files
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
