import React from 'react';
import { 
  FileStack, 
  Target, 
  CheckCheck, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight
} from 'lucide-react';

export default function MetricsBar({ 
  metrics, 
  onFilterFlagged, 
  activeFilter
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      
      {/* 1. Total Files Analyzed */}
      <div className="relative overflow-hidden group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total Files Analyzed
          </span>
          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
            <FileStack className="w-4 h-4 text-indigo-500" />
          </div>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
            {metrics.totalAnalyzed.toLocaleString()}
          </span>
          <span className="inline-flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            {metrics.trendWeek}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <span>Active In-Memory Corpus</span>
          <span className="font-mono text-zinc-700 dark:text-zinc-300">4.2 GB</span>
        </div>
      </div>

      {/* 2. Categorization Confidence */}
      <div className="relative overflow-hidden group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Categorization Confidence
          </span>
          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
            {metrics.confidence}%
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            High Precision
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${metrics.confidence}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            Cosine &gt; 0.88
          </span>
        </div>
      </div>

      {/* 3. Auto-Sorted Today */}
      <div className="relative overflow-hidden group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Auto-Sorted Today
          </span>
          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
            <CheckCheck className="w-4 h-4 text-cyan-500" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
            {metrics.autoSortedToday}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            files moved
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <span>Automation Rate</span>
          <span className="font-mono font-medium text-cyan-600 dark:text-cyan-400">
            {metrics.targetRate}
          </span>
        </div>
      </div>

      {/* 4. Unreadable / Metadata-Only Files */}
      <div 
        onClick={onFilterFlagged}
        className={`relative overflow-hidden group p-4 rounded-xl border transition-all cursor-pointer ${
          activeFilter === 'Metadata Only Fallback'
            ? 'border-amber-500/70 bg-amber-500/10 dark:bg-amber-950/20 ring-1 ring-amber-500/40'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-amber-500/40 dark:hover:border-amber-500/40'
        } shadow-sm`}
        title="Click to filter files requiring inspection or re-OCR"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            Unreadable / Metadata-Only
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          </span>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
            {metrics.unreadableFlagged}
          </span>
          <span className="text-xs text-amber-700 dark:text-amber-300/80 font-medium">
            flagged for review
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <span className="text-amber-600 dark:text-amber-400 font-medium group-hover:underline flex items-center gap-1">
            {activeFilter === 'Metadata Only Fallback' ? 'Clear filter' : 'Filter & inspect'}
            <ArrowUpRight className="w-3 h-3" />
          </span>
          <span className="font-mono text-zinc-500">EXIF / OCR low-res</span>
        </div>
      </div>

    </div>
  );
}
