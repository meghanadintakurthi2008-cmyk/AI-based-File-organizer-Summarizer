export const initialMetrics = {
  totalAnalyzed: 1248,
  confidence: 94.2,
  autoSortedToday: 342,
  unreadableFlagged: 18,
  trendWeek: "+14.8%",
  targetRate: "85.5% automated",
  engineVersion: "TF-IDF + K-Means v2.4",
  workersActive: 4,
};

export const initialRecommendationFiles = [
  {
    id: "f-101",
    name: "transformer_attention_mechanisms_v3.pdf",
    size: "4.8 MB",
    format: "PDF",
    ext: "pdf",
    ingestionMethod: "Full Text NLP",
    predictedCategory: "Research Papers",
    categoryTheme: "violet",
    recommendedFolder: "/Academics/Fall_2026/AI/",
    confidence: 96,
    confidenceReason: "Matched cluster centroid with 0.941 cosine similarity. Key tokens include 'self-attention', 'multi-head', 'encoder-decoder', 'transformer'.",
    alternativeSuggestions: [
      { folder: "/Academics/Research_Archives/", confidence: 78, reason: "Broad historical machine learning archive overlap" },
      { folder: "/Academics/Fall_2026/Distributed_Systems/", confidence: 45, reason: "GPU distributed training cluster keywords detected" }
    ],
    topTokens: [
      { term: "self-attention", weight: 0.88 },
      { term: "multi-head", weight: 0.82 },
      { term: "transformer", weight: 0.79 },
      { term: "cross-entropy", weight: 0.71 },
      { term: "vector-embedding", weight: 0.65 }
    ],
    excerpt: "Abstract: We investigate architectural scaling laws in sparse multi-head self-attention mechanisms across ultra-deep language models...",
    timestamp: "2 mins ago",
    status: "pending"
  },
  {
    id: "f-102",
    name: "Stripe_Invoice_INV-2026-08912.pdf",
    size: "340 KB",
    format: "PDF",
    ext: "pdf",
    ingestionMethod: "OCR Extracted",
    predictedCategory: "Finance",
    categoryTheme: "emerald",
    recommendedFolder: "/Finance/Invoices_2026/",
    confidence: 94,
    confidenceReason: "OCR recognized VAT ID, tabular invoice lines, billing entity 'Stripe Inc.', and currency tokens '$1,450.00 USD'.",
    alternativeSuggestions: [
      { folder: "/Finance/Tax_Filings/", confidence: 72, reason: "Deductible business expense categorization" },
      { folder: "/Finance/Payroll_Summaries/", confidence: 32, reason: "General financial accounting folder" }
    ],
    topTokens: [
      { term: "invoice", weight: 0.94 },
      { term: "stripe-billing", weight: 0.89 },
      { term: "subtotal-vat", weight: 0.81 },
      { term: "due-date", weight: 0.76 }
    ],
    excerpt: "Tax Invoice #INV-2026-08912 | Billed To: Hyperion Labs | Amount Due: $1,450.00 | Date: October 2026...",
    timestamp: "5 mins ago",
    status: "pending"
  },
  {
    id: "f-103",
    name: "lecture_08_quantum_superposition_hamiltonian.docx",
    size: "1.2 MB",
    format: "DOCX",
    ext: "docx",
    ingestionMethod: "Full Text NLP",
    predictedCategory: "Lecture Notes",
    categoryTheme: "blue",
    recommendedFolder: "/Academics/Fall_2026/Quantum_Computing/",
    confidence: 91,
    confidenceReason: "Dense semantic cluster with physics lecture syllabus; extracted eigenvalues, Dirac notation, and qubit state formulations.",
    alternativeSuggestions: [
      { folder: "/Academics/Fall_2026/AI/", confidence: 64, reason: "Quantum machine learning intersection" },
      { folder: "/Academics/Research_Archives/", confidence: 51, reason: "Physics courseware archive" }
    ],
    topTokens: [
      { term: "hamiltonian", weight: 0.92 },
      { term: "qubit-superposition", weight: 0.86 },
      { term: "bloch-sphere", weight: 0.78 },
      { term: "dirac-bra-ket", weight: 0.74 }
    ],
    excerpt: "Lecture 8: Unitary Transformations & Hamiltonian Evolution in Closed Two-Level Quantum Systems...",
    timestamp: "12 mins ago",
    status: "pending"
  },
  {
    id: "f-104",
    name: "scanned_supplier_contract_signed_final.png",
    size: "6.2 MB",
    format: "IMG",
    ext: "png",
    ingestionMethod: "OCR Extracted",
    predictedCategory: "Legal Contracts",
    categoryTheme: "amber",
    recommendedFolder: "/Legal/Master_Service_Agreements/",
    confidence: 88,
    confidenceReason: "Optical Character Recognition detected legal boilerplate: 'indemnification', 'governing law', 'confidentiality clause', and signature lines.",
    alternativeSuggestions: [
      { folder: "/Legal/NDAs_Signed/", confidence: 75, reason: "Contains standard reciprocal non-disclosure clauses" },
      { folder: "/Finance/Invoices_2026/", confidence: 38, reason: "Contains commercial fee schedule annex" }
    ],
    topTokens: [
      { term: "indemnification", weight: 0.91 },
      { term: "jurisdiction", weight: 0.84 },
      { term: "counterparts-signed", weight: 0.79 },
      { term: "arbitration", weight: 0.72 }
    ],
    excerpt: "THIS MASTER SERVICES AGREEMENT is made effective as of the signed date by and between Global Supply LLC...",
    timestamp: "18 mins ago",
    status: "pending"
  },
  {
    id: "f-105",
    name: "circuit_board_rev4_schematic.dwg.png",
    size: "8.9 MB",
    format: "IMG",
    ext: "png",
    ingestionMethod: "Metadata Only Fallback",
    predictedCategory: "Hardware Schematics",
    categoryTheme: "rose",
    recommendedFolder: "/Hardware/Circuits/",
    confidence: 68,
    confidenceReason: "Binary unindexed raster image. Matched via file naming heuristics, EXIF header tags ('AutoDesk CAD v24'), and parent folder context.",
    alternativeSuggestions: [
      { folder: "/Engineering/Architecture_Specs/", confidence: 62, reason: "General hardware system architecture" },
      { folder: "/Unorganized_Inbox/", confidence: 55, reason: "Low textual confidence requires manual triage" }
    ],
    topTokens: [
      { term: "schematic", weight: 0.75 },
      { term: "circuit-rev4", weight: 0.71 },
      { term: "autodesk-tag", weight: 0.62 }
    ],
    excerpt: "[No text layer found - EXIF Metadata: 'Created: Altium Designer v26.1 / Layer: Top Copper / Format: DWG-Export']",
    timestamp: "25 mins ago",
    status: "pending"
  },
  {
    id: "f-106",
    name: "distributed_consensus_raft_notes.txt",
    size: "68 KB",
    format: "TXT",
    ext: "txt",
    ingestionMethod: "Full Text NLP",
    predictedCategory: "Lecture Notes",
    categoryTheme: "blue",
    recommendedFolder: "/Academics/Fall_2026/Distributed_Systems/",
    confidence: 95,
    confidenceReason: "Exact semantic match for Raft algorithm terminology: leader election, log replication, heartbeat intervals, term numbers.",
    alternativeSuggestions: [
      { folder: "/Engineering/Architecture_Specs/", confidence: 71, reason: "Microservice consensus implementation reference" },
      { folder: "/Academics/Fall_2026/AI/", confidence: 40, reason: "Graduate computer science elective" }
    ],
    topTokens: [
      { term: "raft-consensus", weight: 0.96 },
      { term: "leader-election", weight: 0.90 },
      { term: "heartbeat-rpc", weight: 0.85 },
      { term: "log-compaction", weight: 0.77 }
    ],
    excerpt: "Raft Consensus Summary: In Raft, a server can be in one of three states: Leader, Follower, or Candidate. Heartbeat frequency...",
    timestamp: "32 mins ago",
    status: "pending"
  },
  {
    id: "f-107",
    name: "q3_payroll_breakdown_confidential.xlsx",
    size: "512 KB",
    format: "SHEET",
    ext: "xlsx",
    ingestionMethod: "Full Text NLP",
    predictedCategory: "Finance",
    categoryTheme: "emerald",
    recommendedFolder: "/Finance/Payroll_Summaries/",
    confidence: 93,
    confidenceReason: "Spreadsheet columns parsed: 'Gross Salary', 'FICA Tax', '401k Match', 'Employee ID', and department payroll subtotals.",
    alternativeSuggestions: [
      { folder: "/Finance/Tax_Filings/", confidence: 76, reason: "IRS employment quarterly tax reporting" },
      { folder: "/Legal/Master_Service_Agreements/", confidence: 25, reason: "Vendor compensation index" }
    ],
    topTokens: [
      { term: "payroll-disbursement", weight: 0.95 },
      { term: "gross-wages", weight: 0.89 },
      { term: "fica-withholding", weight: 0.83 },
      { term: "q3-total", weight: 0.78 }
    ],
    excerpt: "Table Sheet 1: Employee Payroll Registry Q3 2026. Cumulative disbursements: $248,320. Total headcount: 24...",
    timestamp: "45 mins ago",
    status: "pending"
  },
  {
    id: "f-108",
    name: "fuzzy_receipt_scan_unreadable_009.jpg",
    size: "1.9 MB",
    format: "IMG",
    ext: "jpg",
    ingestionMethod: "Metadata Only Fallback",
    predictedCategory: "Finance",
    categoryTheme: "amber",
    recommendedFolder: "/Finance/Invoices_2026/",
    confidence: 58,
    confidenceReason: "Low OCR readability score (<28% confidence). Classified as expense receipt based on camera EXIF, aspect ratio, and filename prefix.",
    alternativeSuggestions: [
      { folder: "/Unorganized_Inbox/", confidence: 70, reason: "Needs manual human review or clearer scan" },
      { folder: "/Finance/Tax_Filings/", confidence: 49, reason: "Potential tax expense deduction" }
    ],
    topTokens: [
      { term: "receipt-prefix", weight: 0.62 },
      { term: "camera-exif-dcim", weight: 0.54 }
    ],
    excerpt: "[Warning: Low contrast image - OCR returned 4 low-confidence tokens: 'totl', 'tx', 'csh', 'amx']",
    timestamp: "1 hour ago",
    status: "pending"
  }
];

export const initialFolderTree = [
  {
    id: "root-academics",
    name: "Academics",
    path: "/Academics/",
    fileCount: 248,
    isOpen: true,
    children: [
      {
        id: "fall-2026",
        name: "Fall_2026",
        path: "/Academics/Fall_2026/",
        fileCount: 114,
        isOpen: true,
        children: [
          { id: "ai", name: "AI", path: "/Academics/Fall_2026/AI/", fileCount: 42, isOpen: false },
          { id: "dist-sys", name: "Distributed_Systems", path: "/Academics/Fall_2026/Distributed_Systems/", fileCount: 38, isOpen: false },
          { id: "quantum", name: "Quantum_Computing", path: "/Academics/Fall_2026/Quantum_Computing/", fileCount: 34, isOpen: false },
        ]
      },
      { id: "spring-2026", name: "Spring_2026", path: "/Academics/Spring_2026/", fileCount: 86, isOpen: false },
      { id: "research-archives", name: "Research_Archives", path: "/Academics/Research_Archives/", fileCount: 48, isOpen: false }
    ]
  },
  {
    id: "root-finance",
    name: "Finance",
    path: "/Finance/",
    fileCount: 412,
    isOpen: true,
    children: [
      { id: "invoices", name: "Invoices_2026", path: "/Finance/Invoices_2026/", fileCount: 189, isOpen: false },
      { id: "taxes", name: "Tax_Filings", path: "/Finance/Tax_Filings/", fileCount: 95, isOpen: false },
      { id: "payroll", name: "Payroll_Summaries", path: "/Finance/Payroll_Summaries/", fileCount: 128, isOpen: false }
    ]
  },
  {
    id: "root-legal",
    name: "Legal",
    path: "/Legal/",
    fileCount: 164,
    isOpen: false,
    children: [
      { id: "msa", name: "Master_Service_Agreements", path: "/Legal/Master_Service_Agreements/", fileCount: 78, isOpen: false },
      { id: "ndas", name: "NDAs_Signed", path: "/Legal/NDAs_Signed/", fileCount: 86, isOpen: false }
    ]
  },
  {
    id: "root-engineering",
    name: "Engineering",
    path: "/Engineering/",
    fileCount: 310,
    isOpen: false,
    children: [
      { id: "arch-specs", name: "Architecture_Specs", path: "/Engineering/Architecture_Specs/", fileCount: 145, isOpen: false },
      { id: "api-docs", name: "API_Documentation", path: "/Engineering/API_Documentation/", fileCount: 98, isOpen: false },
      { id: "sprint-backlog", name: "Sprint_Backlogs", path: "/Engineering/Sprint_Backlogs/", fileCount: 67, isOpen: false }
    ]
  },
  {
    id: "root-hardware",
    name: "Hardware",
    path: "/Hardware/",
    fileCount: 54,
    isOpen: false,
    children: [
      { id: "circuits", name: "Circuits", path: "/Hardware/Circuits/", fileCount: 54, isOpen: false }
    ]
  },
  {
    id: "root-inbox",
    name: "Unorganized_Inbox",
    path: "/Unorganized_Inbox/",
    fileCount: 60,
    isOpen: false
  }
];

export const initialClusterSuggestions = [
  {
    id: "cluster-1",
    topicName: "Project Silicon",
    suggestedFolder: "/Hardware/Circuits/",
    detectedCount: 12,
    confidence: 91,
    topKeywords: ["verilog", "fpga-timing", "asic", "clock-domain", "altium"],
    description: "Detected dense cluster of 12 unorganized circuit schematics, FPGA HDL notes, and gate-level netlists.",
    sampleFiles: ["fpga_lattice_pins.txt", "alu_verilog_tb.v", "schematic_bus_v2.png"]
  },
  {
    id: "cluster-2",
    topicName: "Health Insurance & Benefits 2026",
    suggestedFolder: "/HR/Benefits_2026/",
    detectedCount: 8,
    confidence: 87,
    topKeywords: ["hsa-deductible", "blue-cross", "open-enrollment", "401k-match"],
    description: "8 policy documents mentioning healthcare premiums, dental coverage, and annual enrollment guides.",
    sampleFiles: ["hsa_contribution_limit.pdf", "benefits_faq_2026.docx"]
  },
  {
    id: "cluster-3",
    topicName: "Q3 Marketing Brand Assets",
    suggestedFolder: "/Marketing/Press_Kits/",
    detectedCount: 15,
    confidence: 84,
    topKeywords: ["brand-guidelines", "svg-vector", "press-release", "keynote"],
    description: "15 high-res brand logos, pitch decks, and media kit files currently scattered across root folders.",
    sampleFiles: ["logo_mark_dark.svg", "press_statement_oct2026.docx"]
  }
];

export const sampleBatchUploads = [
  {
    name: "neural_network_optimization_notes.pdf",
    size: "2.1 MB",
    format: "PDF",
    ext: "pdf",
    ingestionMethod: "Full Text NLP",
    predictedCategory: "Research Papers",
    categoryTheme: "violet",
    recommendedFolder: "/Academics/Fall_2026/AI/",
    confidence: 95,
    confidenceReason: "High TF-IDF cosine alignment with gradient descent and AdamW optimizer centroids.",
    alternativeSuggestions: [
      { folder: "/Academics/Research_Archives/", confidence: 81, reason: "Machine learning theory" }
    ],
    topTokens: [
      { term: "adamw-optimizer", weight: 0.94 },
      { term: "learning-rate-schedule", weight: 0.88 },
      { term: "stochastic-gradient", weight: 0.82 }
    ],
    excerpt: "Analysis of convergence rates using adaptive learning rate scheduling in multi-modal transformers...",
    timestamp: "Just now",
    status: "pending"
  },
  {
    name: "AWS_Cloud_Monthly_Invoice_Oct.pdf",
    size: "720 KB",
    format: "PDF",
    ext: "pdf",
    ingestionMethod: "OCR Extracted",
    predictedCategory: "Finance",
    categoryTheme: "emerald",
    recommendedFolder: "/Finance/Invoices_2026/",
    confidence: 93,
    confidenceReason: "Recognized AWS billing identifier, EC2 compute usage tables, and line totals.",
    alternativeSuggestions: [
      { folder: "/Finance/Tax_Filings/", confidence: 74, reason: "Cloud infrastructure tax deductible expense" }
    ],
    topTokens: [
      { term: "amazon-web-services", weight: 0.96 },
      { term: "ec2-billing", weight: 0.91 },
      { term: "total-due", weight: 0.85 }
    ],
    excerpt: "Amazon Web Services Inc. Invoice #489102-OCT-2026. Account: 8491-0021-3310. Total Due: $3,219.40...",
    timestamp: "Just now",
    status: "pending"
  },
  {
    name: "nda_contract_hyperion_partner.docx",
    size: "420 KB",
    format: "DOCX",
    ext: "docx",
    ingestionMethod: "Full Text NLP",
    predictedCategory: "Legal Contracts",
    categoryTheme: "amber",
    recommendedFolder: "/Legal/NDAs_Signed/",
    confidence: 92,
    confidenceReason: "Identified standard bilateral non-disclosure agreement covenants, term duration, and trade secrets clauses.",
    alternativeSuggestions: [
      { folder: "/Legal/Master_Service_Agreements/", confidence: 70, reason: "Legal commercial provisions" }
    ],
    topTokens: [
      { term: "non-disclosure", weight: 0.97 },
      { term: "confidential-info", weight: 0.91 },
      { term: "trade-secret", weight: 0.84 }
    ],
    excerpt: "MUTUAL NONDISCLOSURE AGREEMENT entered into between Hyperion Systems and Partner Inc...",
    timestamp: "Just now",
    status: "pending"
  }
];
