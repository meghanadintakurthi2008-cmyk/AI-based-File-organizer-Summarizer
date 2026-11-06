// Initial state starting strictly at 0
export const initialMetrics = {
  totalFiles: 0,
  filesAnalyzed: 0,
  recommendations: 0,
  categoriesFound: 0,
  aiAccuracy: 0,
  lastScanTime: "No scans yet",
  typeBreakdown: {
    "PDF Files": 0,
    "Word Files": 0,
    "Excel Files": 0,
    "PowerPoint Files": 0,
    "Image Files": 0,
    "Video Files": 0,
    "Audio Files": 0,
    "Text Files": 0,
    "Code Files": 0,
    "Archive Files": 0,
    "Other Files": 0
  },
  totalAnalyzed: 0,
  confidence: 0,
  autoSortedToday: 0,
  unreadableFlagged: 0,
  trendWeek: "0%",
  targetRate: "0% sorted",
  engineVersion: "File-Type Classifier & Summarizer v3.0",
  workersActive: 4,
};

// Starts completely empty: populated strictly by real user uploads
export const initialRecommendationFiles = [];

// Starts empty
export const initialClusterSuggestions = [];

// 11 Type-based folder structure with 0 initial files
export const initialFolderTree = [
  { id: "fld-pdf", name: "PDF Files", path: "PDF Files/", fileCount: 0, isOpen: true },
  { id: "fld-word", name: "Word Files", path: "Word Files/", fileCount: 0, isOpen: false },
  { id: "fld-excel", name: "Excel Files", path: "Excel Files/", fileCount: 0, isOpen: false },
  { id: "fld-ppt", name: "PowerPoint Files", path: "PowerPoint Files/", fileCount: 0, isOpen: false },
  { id: "fld-image", name: "Image Files", path: "Image Files/", fileCount: 0, isOpen: false },
  { id: "fld-video", name: "Video Files", path: "Video Files/", fileCount: 0, isOpen: false },
  { id: "fld-audio", name: "Audio Files", path: "Audio Files/", fileCount: 0, isOpen: false },
  { id: "fld-text", name: "Text Files", path: "Text Files/", fileCount: 0, isOpen: false },
  { id: "fld-code", name: "Code Files", path: "Code Files/", fileCount: 0, isOpen: false },
  { id: "fld-archive", name: "Archive Files", path: "Archive Files/", fileCount: 0, isOpen: false },
  { id: "fld-other", name: "Other Files", path: "Other Files/", fileCount: 0, isOpen: false }
];
