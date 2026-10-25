import React from 'react';
import { 
  FolderSync, 
  Sparkles, 
  Sun, 
  Moon, 
  Cpu, 
  RefreshCw, 
  Terminal,
  Activity
} from 'lucide-react';

export default function Header({ 
  darkMode, 
  setDarkMode, 
  onSimulateBatch, 
  isProcessing,
  pendingCount,
  onResetData
}) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Engine Tag */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <FolderSync className="w-5 h-5 transition-transform group-hover:scale-110" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                SmartFolder AI
                <span className="hidden sm:inline-block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  — Content-Based Organizer
                </span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                <Sparkles className="w-2.5 h-2.5" />
                v2.4
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Cpu className="w-3 h-3 text-emerald-500" />
                TF-IDF & K-Means Active
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-400" />
                {pendingCount} Pending Triage
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Simulate Pipeline Button */}
          <button
            onClick={onSimulateBatch}
            disabled={isProcessing}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all shadow-sm ${
              isProcessing
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-700'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-500/20 hover:shadow-indigo-500/30 ring-1 ring-indigo-400/30'
            }`}
            title="Inject simulated document batch to test AI clustering"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Simulate AI Ingestion</span>
            <span className="sm:hidden">Simulate</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetData}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60"
            title="Reset Mock Dataset"
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
