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
    summarizable: bool = True

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
    isCustom: bool = False
    parentPath: Optional[str] = None
    children: Optional[List["FolderTreeNode"]] = None

FolderTreeNode.update_forward_refs()

class CreateFolderRequest(BaseModel):
    name: str
    parentPath: Optional[str] = None

class RenameFolderRequest(BaseModel):
    newName: str

class DeleteFolderRequest(BaseModel):
    moveToFolder: Optional[str] = "Other Files/"

class FolderFileItem(BaseModel):
    id: str
    name: str
    size: str
    format: str
    category: str
    status: str
    folder: str
    timestamp: str
    summarizable: bool = True


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

class SummarizeRequest(BaseModel):
    mode: str = "short"

class SummarizeResponse(BaseModel):
    fileId: str
    filename: str
    fileType: str
    mode: str
    supported: bool
    summary: str
    keyPoints: List[str] = []
    metadata: Dict[str, Any] = {}
    message: Optional[str] = None
    wordCount: int = 0

class MetricsResponse(BaseModel):
    totalFiles: int = 0
    filesAnalyzed: int = 0
    recommendations: int = 0
    categoriesFound: int = 0
    aiAccuracy: float = 0.0
    lastScanTime: str = "No scans yet"
    typeBreakdown: Dict[str, int] = {}
    # Backward compatibility fields
    totalAnalyzed: int = 0
    confidence: float = 0.0
    autoSortedToday: int = 0
    unreadableFlagged: int = 0
    trendWeek: str = "0%"
    targetRate: str = "0%"
    engineVersion: str = "File-Type Classifier & Summarizer v3.0"
    workersActive: int = 4

class StructuredSummaryItem(BaseModel):
    fileId: Optional[str] = None
    filename: str
    fileType: str
    title: str = "Untitled Document"
    overview: str
    mainTopic: str
    detailedSummary: str
    importantPoints: List[str] = []
    keyTerms: List[Dict[str, str]] = []
    datesFiguresFacts: List[Dict[str, str]] = []
    conclusion: str = ""
    wordCount: int = 0
    supported: bool = True
    message: Optional[str] = None

class CombinedSummaryResponse(BaseModel):
    individualSummaries: List[StructuredSummaryItem] = []
    combinedSummary: str
    commonTopics: List[str] = []
    keyDifferences: List[str] = []
    keyFindings: List[str] = []
    totalWordCount: int = 0
    fileCount: int = 0

class StorageInfoResponse(BaseModel):
    totalFiles: int = 0
    totalFolders: int = 0
    usedBytes: int = 0
    usedDisplay: str = "0 KB"
    storagePath: str
    isLocal: bool = True
    recentFiles: List[Dict[str, Any]] = []

class RenameFileRequest(BaseModel):
    newName: str

class MoveFileRequest(BaseModel):
    targetFolder: str


class ActivityLogResponse(BaseModel):
    id: int
    activityType: str
    description: str
    fileName: Optional[str] = None
    fileId: Optional[str] = None
    folderFrom: Optional[str] = None
    folderTo: Optional[str] = None
    status: str = "success"
    extraData: Dict[str, Any] = {}
    timestamp: str
    createdAt: str

    class Config:
        from_attributes = True

class DeleteFileRequest(BaseModel):
    permanent: bool = False

class ContentOrganizeRequest(BaseModel):
    fileIds: List[str]
    method: str = "content"  # "content" or "ai"

class ContentOrganizeSuggestion(BaseModel):
    fileId: str
    fileName: str
    suggestedFolder: str
    confidence: float
    reason: str
    topKeywords: List[str] = []

class ContentOrganizeResponse(BaseModel):
    suggestions: List[ContentOrganizeSuggestion]
    groupedTopics: Dict[str, List[str]] = {}  # topic -> [filenames]

class SummaryModeRequest(BaseModel):
    mode: str = "short"  # short, detailed, points, exam
    fileIds: List[str]
