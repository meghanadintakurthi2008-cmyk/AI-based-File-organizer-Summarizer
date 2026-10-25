from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ClusterSuggestion, FileRecord, MetricSnapshot
from ..schemas import ClusterSuggestionResponse
from ..services.folder_service import FolderService

router = APIRouter(prefix="/clusters", tags=["Unsupervised Clusters"])

@router.get("/suggestions", response_model=List[ClusterSuggestionResponse])
def get_cluster_suggestions(db: Session = Depends(get_db)):
    clusters = db.query(ClusterSuggestion).filter(ClusterSuggestion.status == "active").all()
    return [
        ClusterSuggestionResponse(
            id=c.id,
            topicName=c.topic_name,
            suggestedFolder=c.suggested_folder,
            detectedCount=c.detected_count,
            confidence=c.confidence,
            topKeywords=c.top_keywords or [],
            description=c.description,
            sampleFiles=c.sample_files or []
        )
        for c in clusters
    ]

@router.post("/{cluster_id}/materialize")
def materialize_cluster(cluster_id: str, db: Session = Depends(get_db)):
    cluster = db.query(ClusterSuggestion).filter(ClusterSuggestion.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    # 1. Create target folder node
    FolderService.create_folder(db, cluster.suggested_folder)

    # 2. Mark cluster as accepted/materialized
    cluster.status = "materialized"

    # 3. Increment metrics
    metric = db.query(MetricSnapshot).order_by(MetricSnapshot.id.desc()).first()
    if metric:
        metric.auto_sorted_today += cluster.detected_count
        metric.total_analyzed += cluster.detected_count

    db.commit()

    return {
        "success": True,
        "message": f"Created directory '{cluster.suggested_folder}' and organized {cluster.detected_count} files.",
        "folder": cluster.suggested_folder,
        "filesMoved": cluster.detected_count
    }

@router.delete("/{cluster_id}")
def dismiss_cluster(cluster_id: str, db: Session = Depends(get_db)):
    cluster = db.query(ClusterSuggestion).filter(ClusterSuggestion.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    cluster.status = "dismissed"
    db.commit()
    return {"success": True, "message": f"Dismissed cluster '{cluster.topic_name}'"}
