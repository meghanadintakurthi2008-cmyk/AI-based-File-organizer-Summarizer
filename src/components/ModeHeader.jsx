import React from 'react';
import { 
  Sparkles, 
  FolderTree, 
  HardDrive, 
  Layers, 
  Sun, 
  Moon, 
  Download, 
  ArrowLeft
} from 'lucide-react';

export default function ModeHeader({
  activeMode = 'home',
  onSelectMode,
  darkMode = false,
  setDarkMode,
  backendOnline = false,
  onDownloadZip
}) {
  const modeMetadata = {
    summarize: {
      title: 'Summarize Documents',
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      icon: <Sparkles className="w-4 h-4 text-violet-500" />
    },
    organize: {
      title: 'Organize My Files',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: <FolderTree className="w-4 h-4 text-emerald-500" />
    },
    store: {
      title: 'Store & Manage Files',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: <HardDrive className="w-4 h-4 text-blue-500" />
    },
    both: {
      title: 'Summarize + Organize',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      icon: <Layers className="w-4 h-4 text-indigo-500" />
    }
  };

  const currentMeta = modeMetadata[activeMode];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo + Current Selected Operation + Change Operation */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => onSelectMode('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Return to Home Selector"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                SmartFolder<span className="text-indigo-600 dark:text-indigo-400">.AI</span>
              </span>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium hidden sm:block">
                Intelligent File Platform
              </p>
            </div>
          </button>

          {/* Current Selected Operation & Change Operation Option */}
          {activeMode !== 'home' && currentMeta && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-zinc-800">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentMeta.badgeColor}`}>
                {currentMeta.icon}
                <span>{currentMeta.title}</span>
              </span>

              <button
                type="button"
                onClick={() => onSelectMode('home')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                title="Switch to another operation"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Change Operation</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Download ZIP (only where useful), Theme Toggle, Live Connection Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Download Organized ZIP Button - only in organize and both modes where organization occurs */}
          {(activeMode === 'organize' || activeMode === 'both') && (
            <button
              onClick={onDownloadZip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
              title="Download all organized files as a ZIP archive"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download ZIP</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Connection Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className={`hidden sm:inline ${backendOnline ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {backendOnline ? 'Connected' : 'Offline'}
            </span>
          </div>

        </div>

      </div>
    </header>
  );
}
