from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class TokenWeight(BaseModel):
    term: str
    weight: float

class AlternativeSuggestion(BaseModel):
    folder: str
    confidence: float
    reason: str

class FileResponse(BaseModel):
    id: str
    name: str
    size: str
    format: str
    ext: str
    ingestionMethod: str
    predictedCategory: str
    categoryTheme: str
    recommendedFolder: str
    confidence: float
    confidenceReason: Optional[str] = None
    alternativeSuggestions: List[AlternativeSuggestion] = []
    topTokens: List[TokenWeight] = []
    excerpt: Optional[str] = None
    timestamp: str
    status: str

    class Config:
        from_attributes = True

class ApproveMoveRequest(BaseModel):
    targetFolder: Optional[str] = None

class ReassignFolderRequest(BaseModel):
    newFolder: str

class BatchActionRequest(BaseModel):
    fileIds: List[str]

class FolderTreeNode(BaseModel):
    id: str
    name: str
    path: str
    fileCount: int
    isOpen: bool = False
    children: Optional[List["FolderTreeNode"]] = None

FolderTreeNode.update_forward_refs()

class CreateFolderRequest(BaseModel):
    name: str
    parentPath: Optional[str] = None

class ClusterSuggestionResponse(BaseModel):
    id: str
    topicName: str
    suggestedFolder: str
    detectedCount: int
    confidence: float
    topKeywords: List[str]
    description: Optional[str] = None
    sampleFiles: List[str] = []

    class Config:
        from_attributes = True

class MetricsResponse(BaseModel):
    totalAnalyzed: int
    confidence: float
    autoSortedToday: int
    unreadableFlagged: int
    trendWeek: str = "+14.8%"
    targetRate: str = "85.5% automated"
    engineVersion: str = "TF-IDF + K-Means v2.4"
    workersActive: int = 4

class PipelineStageStatus(BaseModel):
    stage: int # 1, 2, 3
    stageName: str
    filename: str
    fileSize: str
    details: str
    completed: bool
