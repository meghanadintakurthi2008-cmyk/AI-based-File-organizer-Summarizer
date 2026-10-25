import React from 'react';
import { 
  FolderSync, 
  Sparkles, 
  Sun, 
  Moon, 
  Activity,
  SlidersHorizontal,
  RefreshCw, 
  RotateCcw
} from 'lucide-react';

export default function Header({ 
  darkMode, 
  setDarkMode, 
  onSimulateBatch, 
  isProcessing,
  pendingCount,
  onResetData,
  backendOnline,
  onOpenAiStatus
}) {
  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 transition-colors shadow-xs">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Engine Tag */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 ring-1 ring-black/5 dark:ring-white/10">
            <FolderSync className="w-5 h-5" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                SmartFolder AI
                <span className="hidden sm:inline-block text-xs font-normal text-slate-500 dark:text-zinc-400">
                  — Content-Based Organizer
                </span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                <Sparkles className="w-2.5 h-2.5" />
                Smart Engine
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                {backendOnline ? 'Live AI Backend Active' : 'AI Engine Standby'}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-slate-600 dark:text-zinc-300">
                <Activity className="w-3 h-3 text-indigo-500" />
                {pendingCount} file{pendingCount === 1 ? '' : 's'} waiting
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-2">
          
          {/* Optional AI Status Button */}
          <button
            onClick={onOpenAiStatus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
            title="Inspect AI processing pipeline & model parameters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">AI Status</span>
          </button>

          {/* Quick Sample Test */}
          <button
            onClick={onSimulateBatch}
            disabled={isProcessing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs ${
              isProcessing
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-zinc-700'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-600/20'
            }`}
            title="Ingest a sample file to test categorization"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Add Sample File</span>
            <span className="sm:hidden">Sample</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetData}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
            title="Reset to default dataset"
            aria-label="Reset Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
