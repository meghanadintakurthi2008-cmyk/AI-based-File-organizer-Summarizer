import React from 'react';
import { 
  FileStack, 
  Target, 
  Clock,
  Sparkles,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  HelpCircle,
  Presentation,
  CheckCircle2
} from 'lucide-react';

const CATEGORY_CARDS = [
  { id: 'PDF Files', label: 'PDF Files', ext: '.pdf', icon: FileText, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60' },
  { id: 'Word Files', label: 'Word Files', ext: '.doc, .docx', icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60' },
  { id: 'Excel Files', label: 'Excel Files', ext: '.xls, .xlsx, .csv', icon: FileSpreadsheet, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60' },
  { id: 'PowerPoint Files', label: 'PowerPoint Files', ext: '.ppt, .pptx', icon: Presentation, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60' },
  { id: 'Image Files', label: 'Image Files', ext: '.jpg, .png, .svg', icon: ImageIcon, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/60' },
  { id: 'Code Files', label: 'Code Files', ext: '.py, .js, .java', icon: FileCode, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/60' },
  { id: 'Text Files', label: 'Text Files', ext: '.txt, .md', icon: FileText, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700' },
  { id: 'Video Files', label: 'Video Files', ext: '.mp4, .mov', icon: Film, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800/60' },
  { id: 'Audio Files', label: 'Audio Files', ext: '.mp3, .wav', icon: Music, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800/60' },
  { id: 'Archive Files', label: 'Archive Files', ext: '.zip, .tar.gz', icon: Archive, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800/60' },
  { id: 'Other Files', label: 'Other Files', ext: 'unknown', icon: HelpCircle, color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' }
];

export default function MetricsBar({ 
  metrics = {},
  activeCategoryFilter = 'All',
  onSelectCategory
}) {
  const totalFiles = metrics.totalFiles ?? 0;
  const filesAnalyzed = metrics.filesAnalyzed ?? 0;
  const recommendations = metrics.recommendations ?? 0;
  const accuracy = (metrics.aiAccuracy || metrics.confidence) ? `${metrics.aiAccuracy || metrics.confidence}%` : '0%';
  const lastScan = metrics.lastScanTime || 'No scans yet';
  const typeBreakdown = metrics.typeBreakdown || {};

  return (
    <div className="mb-6 space-y-4">
      {/* 1. Primary Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Files */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Total Uploaded Files
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileStack className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100 font-mono">
              {totalFiles}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Queued: <strong className="text-slate-700 dark:text-zinc-300">{recommendations}</strong>
          </p>
        </div>

        {/* Card 2: Files Analyzed */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Files Analyzed
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100 font-mono">
              {filesAnalyzed}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Organized: <strong className="text-slate-700 dark:text-zinc-300">{metrics.autoSortedToday ?? 0}</strong>
          </p>
        </div>

        {/* Card 3: AI Type Accuracy */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Type Match Confidence
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100 font-mono">
              {accuracy}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Extension & header validation
          </p>
        </div>

        {/* Card 4: Last Scan Time */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Last Scan Time
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-zinc-100 truncate">
              {lastScan}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Categories detected: <strong className="text-slate-700 dark:text-zinc-300">{metrics.categoriesFound ?? 0}</strong>
          </p>
        </div>

      </div>

      {/* 2. Separate File-Type Cards with Actual File Counts */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>File Categories & Counts ({totalFiles} files total)</span>
          </div>
          {activeCategoryFilter !== 'All' && (
            <button
              onClick={() => onSelectCategory('All')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              Reset Filter (Show All)
            </button>
          )}
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {CATEGORY_CARDS.map((cat) => {
            const count = typeBreakdown[cat.id] ?? 0;
            const Icon = cat.icon;
            const isSelected = activeCategoryFilter === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(isSelected ? 'All' : cat.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 hover:bg-white dark:hover:bg-zinc-800/60 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                  </div>
                  <span className={`font-mono text-sm font-bold ${count > 0 ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-600'}`}>
                    {count}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                    {cat.ext}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
