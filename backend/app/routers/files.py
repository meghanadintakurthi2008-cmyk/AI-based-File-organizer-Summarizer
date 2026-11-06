import os
import shutil
import uuid
import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import FileRecord, SummaryRecord, FolderNode
from ..schemas import (
    FileResponse, 
    ApproveMoveRequest, 
    ReassignFolderRequest, 
    BatchActionRequest,
    SummarizeRequest,
    SummarizeResponse,
    StructuredSummaryItem,
    CombinedSummaryResponse,
    StorageInfoResponse,
    RenameFileRequest,
    MoveFileRequest,
    SummaryModeRequest,
    ContentOrganizeRequest,
    ContentOrganizeResponse
)
from ..config import UPLOAD_DIR, ORGANIZED_DIR
from ..services.extractor import DocumentExtractor
from ..services.classifier import classifier_engine, CATEGORY_DEFINITIONS
from ..services.summarizer import DocumentSummarizer
from ..services.folder_service import FolderService
from ..services.activity_service import ActivityService
from ..services.content_organizer import ContentOrganizer

router = APIRouter(prefix="/files", tags=["Files & Recommendations"])

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def get_format_display(ext: str, category: str) -> str:
    if ext:
        return ext.upper()
    return category.split(" ")[0].upper()

@router.get("/recommendations", response_model=List[FileResponse])
def get_recommendations(
    status: Optional[str] = "pending",
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FileRecord)

    if status and status.lower() != "all":
        query = query.filter(FileRecord.status == status)

    if category and category.lower() != "all":
        query = query.filter(FileRecord.predicted_category == category)

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
        diff_sec = (datetime.datetime.utcnow() - r.created_at).total_seconds()
        time_str = "Just now" if diff_sec < 60 else f"{int(diff_sec // 60)}m ago"
        cat_meta = CATEGORY_DEFINITIONS.get(r.predicted_category, CATEGORY_DEFINITIONS["Other Files"])

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
            timestamp=time_str,
            status=r.status,
            summarizable=cat_meta["summarizable"]
        ))

    return results

@router.post("/upload", response_model=List[FileResponse])
async def upload_files(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads multiple files and automatically detects file types:
    - PDF Files (.pdf) -> PDF Files/
    - Word Files (.doc, .docx) -> Word Files/
    - Excel Files (.xls, .xlsx, .csv) -> Excel Files/
    - PowerPoint Files (.ppt, .pptx) -> PowerPoint Files/
    - Image Files (.jpg, .jpeg, .png, .gif, .webp, .svg) -> Image Files/
    - Video Files (.mp4, .mkv, .avi, .mov, .webm) -> Video Files/
    - Audio Files (.mp3, .wav, .aac, .flac, .ogg) -> Audio Files/
    - Text Files (.txt, .rtf, .md) -> Text Files/
    - Code Files (.py, .java, .c, .cpp, .js, .ts, .html, .css) -> Code Files/
    - Archive Files (.zip, .rar, .7z, .tar, .gz) -> Archive Files/
    - Other Files -> Other Files/
    """
    created_records = []

    for file in files:
        ext = classifier_engine.detect_extension(file.filename)
        file_id = f"f-{uuid.uuid4().hex[:8]}"
        saved_path = UPLOAD_DIR / f"{file_id}_{file.filename}"

        # Save to disk
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        size_bytes = saved_path.stat().st_size
        size_display = format_file_size(size_bytes)

        # 1. Extract content & metadata
        extracted = DocumentExtractor.extract(saved_path, file.filename)
        content_text = extracted.get("raw_text", "")

        # 2. Automatic Type Detection & Content-Driven Subfolder Analysis
        classification = classifier_engine.classify_file(file.filename, content_preview=content_text)
        file_format = get_format_display(ext, classification["predicted_category"])

        # 3. Ensure subfolder node exists in FolderNode if subfolder is recommended
        rec_folder = classification["recommended_folder"]
        if "/" in rec_folder.strip("/"):
            parts = rec_folder.strip("/").split("/", 1)
            parent_p = f"{parts[0]}/"
            sub_name = parts[1]
            try:
                FolderService.create_folder(db, name=sub_name, parent_path=parent_p, is_custom=True)
            except Exception as e:
                print(f"Subfolder auto-create notice: {e}")

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
    FolderService.recalculate_real_counts(db)

    try:
        for r in created_records:
            ActivityService.log(
                db=db,
                activity_type='upload',
                description=f'Uploaded {r.filename}',
                file_name=r.filename,
                file_id=r.id
            )
    except Exception as e:
        print(f"Activity log error: {e}")

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
            status=r.status,
            summarizable=CATEGORY_DEFINITIONS.get(r.predicted_category, {}).get("summarizable", True)
        )
        for r in created_records
    ]

@router.post("/{file_id}/summarize", response_model=SummarizeResponse)
def summarize_file(
    file_id: str,
    payload: Optional[SummarizeRequest] = None,
    mode: Optional[str] = Query("short"),
    db: Session = Depends(get_db)
):
    """
    On-demand document and image summarization.
    Supports PDF, DOCX, PPTX, Excel/CSV, Text, and Images.
    Allows user to choose between 'short' and 'detailed' modes.
    """
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File record not found")

    raw_mode = (payload and payload.mode) or mode or "short"
    selected_mode = raw_mode.lower() if raw_mode else "short"
    if selected_mode not in ["short", "detailed", "points", "exam"]:
        selected_mode = "short"
    file_path = Path(record.current_path or record.original_path)

    summary_result = DocumentSummarizer.summarize_file(
        file_path=file_path,
        filename=record.filename,
        mode=selected_mode
    )

    response = SummarizeResponse(
        fileId=file_id,
        filename=record.filename,
        fileType=summary_result["fileType"],
        mode=selected_mode,
        supported=summary_result["supported"],
        summary=summary_result["summary"],
        keyPoints=summary_result.get("keyPoints", []),
        metadata=summary_result.get("metadata", {}),
        message=summary_result.get("message"),
        wordCount=summary_result.get("wordCount", 0)
    )

    try:
        ActivityService.log(
            db=db,
            activity_type="summarize",
            description=f"Generated {selected_mode} summary for: {record.filename}",
            file_name=record.filename,
            file_id=file_id
        )
    except Exception as e:
        print(f"Activity log error: {e}")

    return response

@router.get("/download-zip")
def download_organized_zip(db: Session = Depends(get_db)):
    """
    Packages all organized files from their type-based folders into a downloadable ZIP file.
    Does not tamper with files on the user's hard drive without permission.
    """
    zip_path = FolderService.create_organized_zip(db)
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="No organized files available for download")

    return FastAPIFileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename="SmartFolder_Organized.zip"
    )

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
    final_filename = FolderService.move_file_to_folder(db, record, target_folder)

    try:
        ActivityService.log(
            db=db,
            activity_type='organize',
            description=f'Organized "{record.filename}" into {target_folder}',
            file_name=record.filename,
            file_id=file_id,
            folder_to=target_folder
        )
    except Exception as e:
        print(f"Activity log error: {e}")

    return {
        "success": True,
        "message": f"Successfully organized '{final_filename}' into {target_folder}",
        "fileId": file_id,
        "targetFolder": target_folder,
        "filename": final_filename
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
    record.confidence = 98.0
    record.confidence_reason = f"{record.filename} → {payload.newFolder}"
    record.status = "pending"
    db.commit()
    FolderService.recalculate_real_counts(db)

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
    FolderService.recalculate_real_counts(db)

    try:
        ActivityService.log(
            db=db,
            activity_type='file_delete',
            description=f'Dismissed "{record.filename}"',
            file_name=record.filename,
            file_id=file_id
        )
    except Exception as e:
        print(f"Activity log error: {e}")

    return {"success": True, "message": f"Dismissed {record.filename}"}

@router.post("/batch-approve")
def batch_approve(payload: BatchActionRequest, db: Session = Depends(get_db)):
    records = db.query(FileRecord).filter(FileRecord.id.in_(payload.fileIds)).all()
    count = 0
    for r in records:
        FolderService.move_file_to_folder(db, r, r.recommended_folder)
        count += 1

    FolderService.recalculate_real_counts(db)
    return {
        "success": True, 
        "approvedCount": count,
        "message": f"Successfully organized {count} files"
    }

@router.post("/batch-dismiss")
def batch_dismiss(payload: BatchActionRequest, db: Session = Depends(get_db)):
    db.query(FileRecord).filter(FileRecord.id.in_(payload.fileIds)).update(
        {"status": "dismissed"}, synchronize_session=False
    )
    db.commit()
    FolderService.recalculate_real_counts(db)
    return {"success": True, "dismissedCount": len(payload.fileIds)}

@router.post("/{file_id}/structured-summary", response_model=StructuredSummaryItem)
def get_structured_summary(file_id: str, db: Session = Depends(get_db)):
    """
    Generates an 8-part structured document summary:
    1. Title 2. Overview 3. Main Topic 4. Detailed Summary
    5. Important Points 6. Key Terms 7. Dates/Figures/Facts 8. Conclusion
    """
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File record not found")

    file_path = Path(record.current_path or record.original_path)
    res = DocumentSummarizer.generate_structured_summary(file_path=file_path, filename=record.filename)
    res["fileId"] = file_id

    # Persist summary record in DB
    try:
        sum_id = f"sum-{uuid.uuid4().hex[:8]}"
        sum_rec = SummaryRecord(
            id=sum_id,
            file_id=record.id,
            filename=record.filename,
            file_type=record.predicted_category,
            mode="structured",
            title=res.get("title"),
            overview=res.get("overview", ""),
            main_topic=res.get("mainTopic", ""),
            detailed_summary=res.get("detailedSummary", ""),
            important_points=res.get("importantPoints", []),
            key_terms=res.get("keyTerms", []),
            dates_figures_facts=res.get("datesFiguresFacts", []),
            conclusion=res.get("conclusion", ""),
            is_combined=0,
            word_count=res.get("wordCount", 0),
            created_at=datetime.datetime.utcnow()
        )
        db.add(sum_rec)
        db.commit()
    except Exception as e:
        print(f"Error persisting summary: {e}")

    return res

@router.post("/combined-summary", response_model=CombinedSummaryResponse)
def get_combined_summary(payload: Optional[BatchActionRequest] = None, db: Session = Depends(get_db)):
    """
    Generates multi-file cross-document synthesis:
    1. Individual 8-part summary of every file
    2. Combined summary of all files
    3. Common topics across documents
    4. Important differences & contrast analysis
    5. Key findings
    """
    if payload and payload.fileIds:
        records = db.query(FileRecord).filter(FileRecord.id.in_(payload.fileIds)).all()
    else:
        records = db.query(FileRecord).filter(FileRecord.status != "dismissed").all()

    if not records:
        raise HTTPException(status_code=400, detail="No files selected or available for combined summarization")

    individual_summaries = []
    for r in records:
        file_path = Path(r.current_path or r.original_path)
        sum_dict = DocumentSummarizer.generate_structured_summary(file_path=file_path, filename=r.filename)
        sum_dict["fileId"] = r.id
        individual_summaries.append(sum_dict)

    combined_res = DocumentSummarizer.generate_combined_summary(individual_summaries)

    # Persist combined summary
    try:
        comb_id = f"csum-{uuid.uuid4().hex[:8]}"
        comb_rec = SummaryRecord(
            id=comb_id,
            file_id=None,
            filename=f"Combined Synthesis ({len(records)} files)",
            file_type="Multi-Document",
            mode="combined",
            title=f"Multi-Document Synthesis ({len(records)} Files)",
            overview=combined_res.get("combinedSummary", "")[:300],
            main_topic=", ".join(combined_res.get("commonTopics", [])[:3]) or "Multi-Document Cross Analysis",
            detailed_summary=combined_res.get("combinedSummary", ""),
            important_points=combined_res.get("keyFindings", []),
            key_terms=[],
            dates_figures_facts=[],
            conclusion=f"Synthesized from {len(records)} files.",
            is_combined=1,
            source_files=[r.filename for r in records],
            common_topics=combined_res.get("commonTopics", []),
            key_differences=combined_res.get("keyDifferences", []),
            key_findings=combined_res.get("keyFindings", []),
            word_count=combined_res.get("totalWordCount", 0),
            created_at=datetime.datetime.utcnow()
        )
        db.add(comb_rec)
        db.commit()
    except Exception as e:
        print(f"Error persisting combined summary: {e}")

    return combined_res

@router.get("/summary-history")
def get_summary_history(db: Session = Depends(get_db)):
    """Returns recent persisted summaries from database."""
    history = db.query(SummaryRecord).order_by(SummaryRecord.created_at.desc()).limit(20).all()
    results = []
    for item in history:
        diff_sec = (datetime.datetime.utcnow() - item.created_at).total_seconds()
        time_str = "Just now" if diff_sec < 60 else f"{int(diff_sec // 60)}m ago"
        results.append({
            "id": item.id,
            "filename": item.filename,
            "title": item.title,
            "mainTopic": item.main_topic,
            "overview": item.overview,
            "detailedSummary": item.detailed_summary,
            "importantPoints": item.important_points or [],
            "keyTerms": item.key_terms or [],
            "datesFiguresFacts": item.dates_figures_facts or [],
            "conclusion": item.conclusion or "",
            "isCombined": bool(item.is_combined),
            "sourceFiles": item.source_files or [],
            "commonTopics": item.common_topics or [],
            "keyDifferences": item.key_differences or [],
            "keyFindings": item.key_findings or [],
            "wordCount": item.word_count,
            "timestamp": time_str
        })
    return results

@router.get("/storage-info", response_model=StorageInfoResponse)
def get_storage_info(db: Session = Depends(get_db)):
    """
    Returns storage details for Option 3 (Store My Files):
    - Total files stored
    - Total folder count
    - Used disk bytes & formatted string
    - Physical storage path on local drive
    """
    total_files = db.query(FileRecord).filter(FileRecord.status != "dismissed").count()
    total_folders = db.query(FolderNode).count()

    total_bytes = 0
    if ORGANIZED_DIR.exists():
        for f in ORGANIZED_DIR.rglob("*"):
            if f.is_file():
                total_bytes += f.stat().st_size

    # Also count uploads
    if UPLOAD_DIR.exists():
        for f in UPLOAD_DIR.rglob("*"):
            if f.is_file():
                total_bytes += f.stat().st_size

    recent = db.query(FileRecord).filter(FileRecord.status != "dismissed").order_by(FileRecord.created_at.desc()).limit(10).all()
    recent_list = [
        {
            "id": r.id,
            "name": r.filename,
            "size": r.size_display,
            "format": r.format,
            "folder": r.recommended_folder,
            "status": r.status
        }
        for r in recent
    ]

    return StorageInfoResponse(
        totalFiles=total_files,
        totalFolders=total_folders,
        usedBytes=total_bytes,
        usedDisplay=format_file_size(total_bytes),
        storagePath=str(ORGANIZED_DIR),
        isLocal=True,
        recentFiles=recent_list
    )

@router.put("/{file_id}/rename")
def rename_file(file_id: str, payload: RenameFileRequest, db: Session = Depends(get_db)):
    """Renames file on disk and in database with safe duplicate collision handling."""
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    new_name = payload.newName.strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Filename cannot be blank")

    # If extension was omitted, preserve original extension
    orig_ext = Path(record.filename).suffix
    if not Path(new_name).suffix and orig_ext:
        new_name = f"{new_name}{orig_ext}"

    # Rename physical files if they exist
    for p_attr in ["current_path", "original_path"]:
        old_path_str = getattr(record, p_attr, None)
        if old_path_str and Path(old_path_str).exists():
            old_p = Path(old_path_str)
            target_p = old_p.parent / new_name
            # Collision handling
            if target_p.exists() and str(target_p) != str(old_p):
                stem = target_p.stem
                suf = target_p.suffix
                c = 1
                while (old_p.parent / f"{stem} ({c}){suf}").exists():
                    c += 1
                target_p = old_p.parent / f"{stem} ({c}){suf}"
                new_name = target_p.name
            try:
                shutil.move(str(old_p), str(target_p))
                setattr(record, p_attr, str(target_p))
            except Exception as e:
                print(f"Error renaming physical file: {e}")

    record.filename = new_name
    db.commit()

    try:
        ActivityService.log(
            db=db,
            activity_type='file_rename',
            description=f'Renamed file to "{new_name}"',
            file_name=new_name,
            file_id=file_id
        )
    except Exception as e:
        print(f"Activity log error: {e}")

    return {"success": True, "fileId": file_id, "newFilename": new_name}

@router.post("/{file_id}/move")
def move_file(file_id: str, payload: MoveFileRequest, db: Session = Depends(get_db)):
    """Directly moves a file to target folder (Store My Files mode)."""
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    target_folder = payload.targetFolder.strip()
    if not target_folder.endswith("/"):
        target_folder = f"{target_folder}/"

    final_name = FolderService.move_file_to_folder(db, record, target_folder)

    try:
        ActivityService.log(
            db=db,
            activity_type='file_move',
            description=f'Moved "{record.filename}" to {target_folder}',
            file_name=record.filename,
            file_id=file_id,
            folder_to=target_folder
        )
    except Exception as e:
        print(f"Activity log error: {e}")

    return {"success": True, "fileId": file_id, "targetFolder": target_folder, "filename": final_name}


@router.delete("/{file_id}")
def delete_file(file_id: str, db: Session = Depends(get_db)):
    """Permanently deletes a file record and its physical files from storage."""
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File record not found")

    filename = record.filename
    # Delete physical file from disk (original_path and current_path if they differ)
    deleted_paths = set()
    for path_attr in ["current_path", "original_path"]:
        path_str = getattr(record, path_attr, None)
        if path_str and path_str not in deleted_paths:
            deleted_paths.add(path_str)
            p = Path(path_str)
            if p.exists() and p.is_file():
                try:
                    p.unlink()
                except Exception as e:
                    print(f"Could not delete physical file {p}: {e}")

    # Delete summary records for this file
    db.query(SummaryRecord).filter(SummaryRecord.file_id == file_id).delete()

    # Delete file record from DB
    db.delete(record)
    db.commit()
    FolderService.recalculate_real_counts(db)

    # Log activity: type='file_delete', description=f'Deleted file: {filename}'
    try:
        ActivityService.log(
            db=db,
            activity_type='file_delete',
            description=f'Deleted file: {filename}',
            file_name=filename,
            file_id=file_id
        )
    except Exception as e:
        print(f"Activity log error: {e}")

    return {"success": True, "message": f"Deleted '{filename}' successfully", "fileId": file_id}


@router.get("/{file_id}/download")
def download_file(file_id: str, db: Session = Depends(get_db)):
    """Downloads an individual file directly."""
    record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File record not found")

    file_path = None
    for p_attr in ["current_path", "original_path"]:
        p_str = getattr(record, p_attr, None)
        if p_str:
            p = Path(p_str)
            if p.exists() and p.is_file():
                file_path = p
                break

    if not file_path:
        raise HTTPException(status_code=404, detail=f"Physical file for '{record.filename}' not found on disk")

    try:
        ActivityService.log(
            db=db,
            activity_type='file_download',
            description=f"Downloaded file: {record.filename}",
            file_name=record.filename,
            file_id=file_id
        )
    except Exception as e:
        print(f"Activity log error: {e}")

    return FastAPIFileResponse(
        path=str(file_path),
        filename=record.filename
    )


@router.post("/content-organize", response_model=ContentOrganizeResponse)
def content_organize(payload: ContentOrganizeRequest, db: Session = Depends(get_db)):
    """
    Content-based topic analysis:
    - Get file records for provided fileIds
    - Read excerpt/text from DB record (do NOT re-extract, too slow)
    - Use ContentOrganizer to group files by topic
    - Return ContentOrganizeResponse with suggestions and grouped topics
    - Log activity: type='content_organize'
    """
    if not payload.fileIds:
        return ContentOrganizeResponse(suggestions=[], groupedTopics={})

    records = db.query(FileRecord).filter(FileRecord.id.in_(payload.fileIds)).all()
    if not records:
        raise HTTPException(status_code=404, detail="No matching file records found")

    result = ContentOrganizer.organize_files(records)

    try:
        ActivityService.log(
            db=db,
            activity_type='content_organize',
            description=f"Analyzed content of {len(records)} files for topic-based organization",
            extra_data={"file_count": len(records), "topic_count": len(result.get("groupedTopics", {}))}
        )
    except Exception as e:
        print(f"Activity log error: {e}")

    return ContentOrganizeResponse(
        suggestions=result.get("suggestions", []),
        groupedTopics=result.get("groupedTopics", {})
    )


@router.post("/summarize-mode", response_model=List[SummarizeResponse])
def summarize_multiple_mode(payload: SummaryModeRequest, db: Session = Depends(get_db)):
    """
    Multi-mode summary (short, detailed, points, exam):
    - For each fileId in payload.fileIds:
      - Get file record
      - Call DocumentSummarizer.summarize_file(path, filename, mode=mode)
      - Save to summary_records table
      - Log activity: type='summarize'
    - Return list of SummarizeResponse objects
    """
    if not payload.fileIds:
        return []

    records = db.query(FileRecord).filter(FileRecord.id.in_(payload.fileIds)).all()
    if not records:
        raise HTTPException(status_code=404, detail="No matching file records found")

    mode = payload.mode.lower() if payload.mode else "short"
    if mode not in ["short", "detailed", "points", "exam"]:
        mode = "short"

    results = []
    for record in records:
        file_path = Path(record.current_path or record.original_path or "")
        summary_result = DocumentSummarizer.summarize_file(
            file_path=file_path,
            filename=record.filename,
            mode=mode
        )

        # Save to summary_records table
        try:
            sum_id = f"sum-{uuid.uuid4().hex[:8]}"
            sum_rec = SummaryRecord(
                id=sum_id,
                file_id=record.id,
                filename=record.filename,
                file_type=summary_result.get("fileType", record.predicted_category),
                mode=mode,
                title=record.filename,
                overview=summary_result.get("summary", "")[:300],
                main_topic=record.predicted_category,
                detailed_summary=summary_result.get("summary", ""),
                important_points=summary_result.get("keyPoints", []),
                key_terms=[],
                dates_figures_facts=[],
                conclusion="",
                is_combined=0,
                word_count=summary_result.get("wordCount", 0),
                created_at=datetime.datetime.utcnow()
            )
            db.add(sum_rec)
            db.commit()
        except Exception as e:
            print(f"Error persisting summary record for {record.filename}: {e}")

        # Log activity: type='summarize'
        try:
            ActivityService.log(
                db=db,
                activity_type='summarize',
                description=f"Generated {mode} summary for: {record.filename}",
                file_name=record.filename,
                file_id=record.id
            )
        except Exception as e:
            print(f"Activity log error: {e}")

        results.append(SummarizeResponse(
            fileId=record.id,
            filename=record.filename,
            fileType=summary_result.get("fileType", record.predicted_category),
            mode=mode,
            supported=summary_result.get("supported", True),
            summary=summary_result.get("summary", ""),
            keyPoints=summary_result.get("keyPoints", []),
            metadata=summary_result.get("metadata", {}),
            message=summary_result.get("message"),
            wordCount=summary_result.get("wordCount", 0)
        ))

    return results

