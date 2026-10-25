import os
import shutil
import uuid
import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import FileRecord
from ..schemas import (
    FileResponse, 
    ApproveMoveRequest, 
    ReassignFolderRequest, 
    BatchActionRequest
)
from ..config import UPLOAD_DIR
from ..services.extractor import DocumentExtractor
from ..services.classifier import classifier_engine
from ..services.folder_service import FolderService

router = APIRouter(prefix="/files", tags=["Files & Recommendations"])

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def get_file_format(ext: str) -> str:
    ext_lower = ext.lower()
    if ext_lower == "pdf":
        return "PDF"
    elif ext_lower in ["docx", "doc"]:
        return "DOCX"
    elif ext_lower in ["png", "jpg", "jpeg", "webp"]:
        return "IMG"
    elif ext_lower in ["xlsx", "xls", "csv"]:
        return "SHEET"
    return "TXT"

@router.get("/recommendations", response_model=List[FileResponse])
def get_recommendations(
    status: Optional[str] = "pending",
    category: Optional[str] = None,
    method: Optional[str] = None,
    search: Optional[str] = None,
    min_confidence: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FileRecord)

    if status and status.lower() != "all":
        query = query.filter(FileRecord.status == status)

    if category and category.lower() != "all":
        query = query.filter(FileRecord.predicted_category == category)

    if method and method.lower() != "all":
        query = query.filter(FileRecord.ingestion_method == method)

    if min_confidence:
        query = query.filter(FileRecord.confidence >= min_confidence)

    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (FileRecord.filename.ilike(search_fmt)) |
            (FileRecord.predicted_category.ilike(search_fmt)) |
            (FileRecord.recommended_folder.ilike(search_fmt))
        )

    records = query.order_by(FileRecord.created_at.desc()).all()

    results = []
    for r in records:
        results.append(FileResponse(
            id=r.id,
            name=r.filename,
            size=r.size_display,
            format=r.format,
            ext=r.ext,
            ingestionMethod=r.ingestion_method,
            predictedCategory=r.predicted_category,
            categoryTheme=r.category_theme,
            recommendedFolder=r.recommended_folder,
            confidence=r.confidence,
            confidenceReason=r.confidence_reason,
            alternativeSuggestions=r.alternative_suggestions or [],
            topTokens=r.top_tokens or [],
            excerpt=r.excerpt,
            timestamp="Just now" if (datetime.datetime.utcnow() - r.created_at).total_seconds() < 120 else f"{int((datetime.datetime.utcnow() - r.created_at).total_seconds() // 60)}m ago",
            status=r.status
        ))

    return results

@router.post("/upload", response_model=List[FileResponse])
async def upload_files(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Ingests files through the 3-stage AI pipeline:
    Stage 1: Extracting Text (PDF / DOCX parsing or OCR)
    Stage 2: Running TF-IDF & Classification (Cosine similarity)
    Stage 3: Matching Cluster Centroids (Assigning folder & alternatives)
    """
    created_records = []

    for file in files:
        ext = file.filename.split(".")[-1].lower() if "." in file.filename else "txt"
        file_id = f"f-{uuid.uuid4().hex[:8]}"
        saved_path = UPLOAD_DIR / f"{file_id}_{file.filename}"

        # Save to disk
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        size_bytes = saved_path.stat().st_size
        size_display = format_file_size(size_bytes)
        file_format = get_file_format(ext)

        # Stage 1: Extract text
        extracted = DocumentExtractor.extract(saved_path, file.filename)

        # Stage 2 & 3: Classify via TF-IDF & Centroid Matching
        classification = classifier_engine.predict_folder(
            text=extracted["raw_text"],
            filename=file.filename,
            method=extracted["method"]
        )

        record = FileRecord(
            id=file_id,
            filename=file.filename,
            original_path=str(saved_path),
            current_path=str(saved_path),
            size_bytes=size_bytes,
            size_display=size_display,
            format=file_format,
            ext=ext,
            ingestion_method=extracted["method"],
            predicted_category=classification["predicted_category"],
            category_theme=classification["category_theme"],
            recommended_folder=classification["recommended_folder"],
            confidence=classification["confidence"],
            confidence_reason=classification["confidence_reason"],
            alternative_suggestions=classification["alternative_suggestions"],
            top_tokens=classification["top_tokens"],
            excerpt=extracted["excerpt"],
            status="pending",
            created_at=datetime.datetime.utcnow()
        )

        db.add(record)
        created_records.append(record)

    db.commit()

    return [
        FileResponse(
            id=r.id,
            name=r.filename,
            size=r.size_display,
            format=r.format,
            ext=r.ext,
            ingestionMethod=r.ingestion_method,
            predictedCategory=r.predicted_category,
            categoryTheme=r.category_theme,
            recommendedFolder=r.recommended_folder,
            confidence=r.confidence,
            confidenceReason=r.confidence_reason,
            alternativeSuggestions=r.alternative_suggestions or [],
            topTokens=r.top_tokens or [],
            excerpt=r.excerpt,
            timestamp="Just now",
            status=r.status
        )
        for r in created_records
    ]

@router.post("/{file_id}/approve")
def approve_move(
    file_id: str,
    payload: Optional[ApproveMoveRequest] = None,
    db: Session = Depends(get_db)
):
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File record not found")

    target_folder = (payload and payload.targetFolder) or record.recommended_folder
    FolderService.move_file_to_folder(db, record, target_folder)

    return {
        "success": True,
        "message": f"Successfully moved '{record.filename}' to {target_folder}",
        "fileId": file_id,
        "targetFolder": target_folder
    }

@router.post("/{file_id}/reassign")
def reassign_folder(
    file_id: str,
    payload: ReassignFolderRequest,
    db: Session = Depends(get_db)
):
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File record not found")

    record.recommended_folder = payload.newFolder
    record.confidence = 90.0
    record.confidence_reason = f"User reassigned target to {payload.newFolder}."
    record.status = "pending"
    db.commit()

    return {
        "success": True,
        "message": f"Reassigned '{record.filename}' to {payload.newFolder}",
        "fileId": file_id,
        "newFolder": payload.newFolder
    }

@router.delete("/{file_id}/dismiss")
def dismiss_file(file_id: str, db: Session = Depends(get_db)):
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File record not found")

    record.status = "dismissed"
    db.commit()
    return {"success": True, "message": f"Dismissed {record.filename}"}

@router.post("/batch-approve")
def batch_approve(payload: BatchActionRequest, db: Session = Depends(get_db)):
    records = db.query(FileRecord).filter(FileRecord.id.in_(payload.fileIds)).all()
    count = 0
    for r in records:
        FolderService.move_file_to_folder(db, r, r.recommended_folder)
        count += 1

    return {"success": True, "approvedCount": count}

@router.post("/batch-dismiss")
def batch_dismiss(payload: BatchActionRequest, db: Session = Depends(get_db)):
    db.query(FileRecord).filter(FileRecord.id.in_(payload.fileIds)).update(
        {"status": "dismissed"}, synchronize_session=False
    )
    db.commit()
    return {"success": True, "dismissedCount": len(payload.fileIds)}
