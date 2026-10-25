// Empty initial state without fake / demo records
export const initialMetrics = {
  totalAnalyzed: 0,
  confidence: 0,
  autoSortedToday: 0,
  unreadableFlagged: 0,
  trendWeek: "0%",
  targetRate: "0% sorted",
  engineVersion: "TF-IDF + K-Means v2.4",
  workersActive: 4,
};

// Starts empty: populated strictly by user uploads and backend recommendations
export const initialRecommendationFiles = [];

// Starts empty: populated only when unsupervised clusters are detected from real files
export const initialClusterSuggestions = [];

// Default directory layout template with 0 initial files
export const initialFolderTree = [
  {
    id: "root-academics",
    name: "Academics",
    path: "/Academics/",
    fileCount: 0,
    isOpen: true,
    children: [
      {
        id: "fall-2026",
        name: "Fall_2026",
        path: "/Academics/Fall_2026/",
        fileCount: 0,
        isOpen: true,
        children: [
          { id: "ai", name: "AI", path: "/Academics/Fall_2026/AI/", fileCount: 0, isOpen: false },
          { id: "dist-sys", name: "Distributed_Systems", path: "/Academics/Fall_2026/Distributed_Systems/", fileCount: 0, isOpen: false },
          { id: "quantum", name: "Quantum_Computing", path: "/Academics/Fall_2026/Quantum_Computing/", fileCount: 0, isOpen: false },
        ]
      },
      { id: "spring-2026", name: "Spring_2026", path: "/Academics/Spring_2026/", fileCount: 0, isOpen: false },
      { id: "research-archives", name: "Research_Archives", path: "/Academics/Research_Archives/", fileCount: 0, isOpen: false }
    ]
  },
  {
    id: "root-finance",
    name: "Finance",
    path: "/Finance/",
    fileCount: 0,
    isOpen: true,
    children: [
      { id: "invoices", name: "Invoices_2026", path: "/Finance/Invoices_2026/", fileCount: 0, isOpen: false },
      { id: "taxes", name: "Tax_Filings", path: "/Finance/Tax_Filings/", fileCount: 0, isOpen: false },
      { id: "payroll", name: "Payroll_Summaries", path: "/Finance/Payroll_Summaries/", fileCount: 0, isOpen: false }
    ]
  },
  {
    id: "root-legal",
    name: "Legal",
    path: "/Legal/",
    fileCount: 0,
    isOpen: false,
    children: [
      { id: "msa", name: "Master_Service_Agreements", path: "/Legal/Master_Service_Agreements/", fileCount: 0, isOpen: false },
      { id: "ndas", name: "NDAs_Signed", path: "/Legal/NDAs_Signed/", fileCount: 0, isOpen: false }
    ]
  },
  {
    id: "root-engineering",
    name: "Engineering",
    path: "/Engineering/",
    fileCount: 0,
    isOpen: false,
    children: [
      { id: "arch-specs", name: "Architecture_Specs", path: "/Engineering/Architecture_Specs/", fileCount: 0, isOpen: false },
      { id: "api-docs", name: "API_Documentation", path: "/Engineering/API_Documentation/", fileCount: 0, isOpen: false },
      { id: "sprint-backlog", name: "Sprint_Backlogs", path: "/Engineering/Sprint_Backlogs/", fileCount: 0, isOpen: false }
    ]
  },
  {
    id: "root-hardware",
    name: "Hardware",
    path: "/Hardware/",
    fileCount: 0,
    isOpen: false,
    children: [
      { id: "circuits", name: "Circuits", path: "/Hardware/Circuits/", fileCount: 0, isOpen: false }
    ]
  },
  {
    id: "root-inbox",
    name: "Unorganized_Inbox",
    path: "/Unorganized_Inbox/",
    fileCount: 0,
    isOpen: false
  }
];
