import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ActivityLog
from ..schemas import ActivityLogResponse

router = APIRouter(prefix="/activity", tags=["Activity History"])


def format_activity(item: ActivityLog) -> dict:
    diff_sec = (datetime.datetime.utcnow() - item.created_at).total_seconds()
    if diff_sec < 60:
        time_str = "Just now"
    elif diff_sec < 3600:
        time_str = f"{int(diff_sec // 60)}m ago"
    elif diff_sec < 86400:
        time_str = f"{int(diff_sec // 3600)}h ago"
    else:
        time_str = item.created_at.strftime("%d %b, %I:%M %p")

    return {
        "id": item.id,
        "activityType": item.activity_type,
        "description": item.description,
        "fileName": item.file_name,
        "fileId": item.file_id,
        "folderFrom": item.folder_from,
        "folderTo": item.folder_to,
        "status": item.status,
        "extraData": item.extra_data or {},
        "timestamp": time_str,
        "createdAt": item.created_at.strftime("%d %b %Y, %I:%M %p")
    }


@router.get("", response_model=List[dict])
def get_activity_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    activity_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns complete activity history from database, newest first."""
    query = db.query(ActivityLog).order_by(ActivityLog.created_at.desc())
    if activity_type and activity_type.lower() != "all":
        query = query.filter(ActivityLog.activity_type == activity_type)
    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (ActivityLog.description.ilike(search_fmt)) |
            (ActivityLog.file_name.ilike(search_fmt))
        )
    items = query.offset(offset).limit(limit).all()
    return [format_activity(a) for a in items]


@router.get("/recent", response_model=List[dict])
def get_recent_activities(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """Returns recent N activities for dashboard widget."""
    items = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return [format_activity(a) for a in items]


@router.delete("/clear")
def clear_activity_history(db: Session = Depends(get_db)):
    """Clears all activity history after user confirmation."""
    count = db.query(ActivityLog).count()
    db.query(ActivityLog).delete()
    db.commit()
    return {"success": True, "clearedCount": count, "message": f"Cleared {count} activity records"}
