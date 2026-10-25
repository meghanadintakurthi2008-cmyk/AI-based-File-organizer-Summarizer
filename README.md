# SmartFolder AI - Content-Based Organizer & Folder Recommendation System

A responsive, high-performance, and modern React dashboard engineered with **React 19**, **Tailwind CSS v4**, and **Lucide React**. Designed with a professional, minimalist aesthetic inspired by Linear, Raycast, and Notion.

---

## 🚀 Key Modules & Architecture

### 1. Header & Quick Metrics Bar
- **System Title & Engine Status**: Real-time status for the TF-IDF and K-Means Clustering worker pipeline (`v2.4 Active`).
- **Dark / Light Mode**: Seamless theme switching with persistent CSS classes and custom color tokens.
- **Interactive Metrics Cards**:
  - **Total Files Analyzed**: Live count (1,248+) with week-over-week trend indicator.
  - **Categorization Confidence**: 94.2% precision indicator with visual gradient meter.
  - **Auto-Sorted Today**: 342 files organized with target automation completion rate.
  - **Unreadable / Metadata-Only Files**: 18 flagged documents; interactive 1-click filter directly displays low-contrast / EXIF-only files for triage.

### 2. Drag-and-Drop Ingestion Zone
- **Interactive Drop Area**: Accepts `.pdf`, `.docx`, `.txt`, `.png`, `.jpg`, `.xlsx`, `.csv`.
- **Live 3-Stage AI Processing Pipeline**:
  1. **Extracting Text**: Doc parsing, OCR text stream recovery, tokenization.
  2. **Running TF-IDF & Classification**: N-gram term weighting, L2 normalization, cosine similarity scoring.
  3. **Matching Cluster Centroids**: Multi-dimensional vector distance matching against folder centroids.
- **Quick Demo Ingestion Buttons**: 1-click test buttons for academic papers, invoices, and legal agreements.

### 3. Live File Recommendation Table
- **File Details**: File name, size, time, and format badges (PDF, DOCX, IMG, SHEET, TXT).
- **Ingestion Method Badges**:
  - `Full Text NLP` (Emerald)
  - `OCR Extracted` (Indigo)
  - `Metadata Only Fallback` (Amber)
- **Predicted Category**: Color-coded category pills (`Research Papers`, `Finance`, `Lecture Notes`, `Legal Contracts`, `Hardware Schematics`).
- **Recommended Target Folder & Confidence Bar**:
  - Path breadcrumb (`/Academics/Fall_2026/AI/`).
  - Dynamic confidence percentage progress bar with color thresholds (≥90% green, 75-89% amber, <75% red).
- **Alternative Suggestions Dropdown**:
  - Displays 2nd and 3rd candidate folders with confidence percentage and contextual matching reason.
  - 1-click "Assign to this folder" switch.
- **Row & Batch Actions**:
  - `Approve & Move`: Optimistic routing, folder counter increment, toast notification, and celebratory confetti burst.
  - `Reassign Folder`: Popover/Modal to select existing directories or enter custom paths.
  - `Dismiss`: Removes recommendation from pending queue.
  - `Inspect AI`: Modal showing top TF-IDF keywords, weight bars, and text excerpts.

### 4. Right Sidebar - Discovered Clusters & Folder Tree
- **Directory Structure Tree**:
  - Interactive nested tree view with collapsible/expandable nodes.
  - Real-time file count counters that react dynamically to approvals and movements.
  - Quick "+ Add Folder" creation tool.
- **Unsupervised Cluster Suggestions**:
  - Discovers emergent patterns from unorganized inbox items.
  - Displays detected count, keyword tags (e.g. `#verilog`, `#fpga-timing`, `#asic`), and target suggestions.
  - 1-click "Create & Move All" to instantiate new directory nodes.

---

## 🛠️ Tech Stack

- **React 19**
- **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Lucide React** (Vector icons)
- **Canvas-Confetti** (Micro-interaction celebrations)
- **Oxlint** (Blazing fast linting)

---

## 💻 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run Oxlint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```
