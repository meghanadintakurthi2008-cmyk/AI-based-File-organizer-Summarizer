import React from 'react';
import { 
  FileText, 
  FolderTree, 
  HardDrive, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  BookOpen
} from 'lucide-react';

export default function HomeSelector({ onSelectMode, backendOnline = true }) {
  const options = [
    {
      id: 'summarize',
      badge: 'Option 1',
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      title: 'Summarize Documents',
      tagline: 'Upload one or multiple files and get easy-to-understand AI summaries.',
      icon: <FileText className="w-7 h-7 text-violet-600 dark:text-violet-400" />,
      accentGradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
      borderColor: 'hover:border-violet-500/50 hover:shadow-violet-500/10',
      btnColor: 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20',
      features: [
        'Choose single document or multi-file batch upload',
        '8-part structured breakdown (Overview, Points, Terms, Dates & Facts)',
        'Cross-document combined synthesis and key differences',
        'One-click copy to clipboard and Markdown (.md) download'
      ],
      ctaText: 'Summarize Documents'
    },
    {
      id: 'organize',
      badge: 'Option 2',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      title: 'Organize My Files',
      tagline: 'Let AI analyze file contents and suggest suitable folders.',
      icon: <FolderTree className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
      accentGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
      features: [
        'Analyzes actual text inside documents beyond naive filenames',
        'Detects subjects and suggests folders (e.g. Academic/DBMS)',
        'Shows folder recommendations before moving any files',
        'User approval: approve, reassign, or reject with ZIP export'
      ],
      ctaText: 'Organize My Files'
    },
    {
      id: 'store',
      badge: 'Option 3',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      title: 'Store & Manage Files',
      tagline: 'Upload, save, search, preview and manage your files.',
      icon: <HardDrive className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
      accentGradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
      borderColor: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      btnColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20',
      features: [
        'Persistent storage on your local drive and database',
        'Create custom folders, subfolders, and hierarchies',
        'Search, filter, preview, rename, and move files',
        'Files remain available after refreshing or reopening the website'
      ],
      ctaText: 'Store & Manage Files'
    },
    {
      id: 'both',
      badge: 'Option 4',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      title: 'Summarize + Organize',
      tagline: 'Get individual document summaries and organize files into meaningful folders.',
      icon: <Layers className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      accentGradient: 'from-indigo-500/20 via-blue-500/10 to-transparent',
      borderColor: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
      btnColor: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20',
      features: [
        'End-to-end understanding and content-based organization',
        'Full 8-part summaries and combined synthesis for multi-file batches',
        'Subject-driven folder recommendations with user approval',
        'Download complete organized package as a ZIP archive'
      ],
      ctaText: 'Summarize + Organize'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
        
        {/* Connection status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 mb-5">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-600 dark:text-zinc-300">
            {backendOnline ? 'AI Processing Engine Active' : 'Connecting to Server...'}
          </span>
          <span className="text-slate-300 dark:text-zinc-600">•</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-semibold">
            FastAPI + SQLite
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Welcome to <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">SmartFolder AI</span>
        </h1>
        
        <p className="mt-3 text-base sm:text-xl text-slate-600 dark:text-zinc-300 font-normal">
          Your files, intelligently organized and understood.
        </p>

        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-zinc-800/80">
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
            What would you like to do with your files?
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Choose one of the four options below to start.
          </p>
        </div>

      </div>

      {/* 4 Interactive Option Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => onSelectMode(opt.id)}
            className={`group relative rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden ${opt.borderColor} hover:-translate-y-0.5`}
          >
            {/* Subtle Gradient Glow in Top Corner */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${opt.accentGradient} rounded-full blur-2xl pointer-events-none -mr-16 -mt-16 opacity-60 group-hover:opacity-100 transition-opacity`} />

            <div>
              {/* Card Top Row: Badge & Icon */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${opt.badgeColor}`}>
                  {opt.badge}
                </span>

                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-zinc-700/60 shadow-xs group-hover:scale-110 transition-transform duration-300">
                  {opt.icon}
                </div>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {opt.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 mt-1.5 mb-5 font-normal leading-relaxed">
                {opt.tagline}
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-2 mb-6 text-xs text-slate-600 dark:text-zinc-400">
                {opt.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Launch CTA Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                Click card to select
              </span>

              <button
                type="button"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${opt.btnColor} group-hover:gap-2.5 cursor-pointer`}
              >
                <span>{opt.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Trust & Transparency Footer */}
      <div className="mt-12 text-center text-xs text-slate-400 dark:text-zinc-500 flex flex-wrap items-center justify-center gap-5 sm:gap-8 pt-6 border-t border-slate-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <span>Local Storage Privacy — Files never leave your computer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-violet-500" />
          <span>Extractive TextRank & TF-IDF NLP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span>PDF, Word, PPTX, Excel & Plain Text</span>
        </div>
      </div>

    </div>
  );
}
