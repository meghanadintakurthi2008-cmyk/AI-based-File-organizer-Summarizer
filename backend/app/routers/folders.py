from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import FolderNode
from ..schemas import FolderTreeNode, CreateFolderRequest
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

    node = FolderService.create_folder(db, payload.name, payload.parentPath)
    return FolderTreeNode(
        id=node.id,
        name=node.name,
        path=node.path,
        fileCount=node.file_count,
        isOpen=bool(node.is_open),
        children=[]
    )
