import React from 'react';
import { 
  FileStack, 
  Target, 
  CheckCheck, 
  AlertCircle
} from 'lucide-react';

export default function MetricsBar({ 
  metrics, 
  onFilterFlagged, 
  activeFilter
}) {
  const isFlaggedActive = activeFilter === 'Metadata Only Fallback' || activeFilter === 'Needs Review';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      
      {/* 1. Total Files Analyzed */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <FileStack className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block truncate">
            Total Files Analyzed
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900 dark:text-zinc-100 font-mono">
              {metrics.totalAnalyzed.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {metrics.trendWeek}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Categorization Confidence */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Target className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block truncate">
            Categorization Accuracy
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900 dark:text-zinc-100 font-mono">
              {metrics.confidence}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              high match
            </span>
          </div>
        </div>
      </div>

      {/* 3. Auto-Sorted Today */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
          <CheckCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block truncate">
            Auto-Sorted Today
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900 dark:text-zinc-100 font-mono">
              {metrics.autoSortedToday}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              files routed
            </span>
          </div>
        </div>
      </div>

      {/* 4. Needs Review */}
      <div 
        onClick={onFilterFlagged}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          isFlaggedActive
            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-300 dark:hover:border-amber-700'
        }`}
        title="Click to filter files that need review"
      >
        <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block truncate">
            Needs Manual Review
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400 font-mono">
              {metrics.unreadableFlagged}
            </span>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium underline">
              {isFlaggedActive ? 'showing' : 'filter'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
