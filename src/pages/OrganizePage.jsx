import React from 'react';
import {
  Sparkles,
  FolderPlus,
  BrainCircuit,
  Check,
  ArrowRight,
  FolderTree
} from 'lucide-react';

export default function OrganizePage({ onNavigate }) {
  const methods = [
    {
      id: 'organize-ai',
      badge: 'Method 1',
      title: 'AI-Recommended Organization',
      description: 'Let SmartFolder AI suggest suitable folders for your files.',
      icon: Sparkles,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-950/40',
      btnBg: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20',
      features: [
        'Analyzes filename, type, and document content',
        'Suggests meaningful folder names automatically',
        'Review suggestions before moving any files',
        'Edit folder names before confirming'
      ],
      buttonText: 'Use AI Recommendations'
    },
    {
      id: 'organize-user',
      badge: 'Method 2',
      title: 'User-Defined Organization',
      description: 'Organize files according to folders and categories created by you.',
      icon: FolderPlus,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
      features: [
        'Upload files and assign them to custom folders',
        'Create, rename, and delete folders',
        'Select multiple files and move them together',
        'You decide where every file goes'
      ],
      buttonText: 'Organize My Way'
    },
    {
      id: 'organize-content',
      badge: 'Method 3',
      title: 'Content-Based Organization',
      description: 'Organize documents according to the actual information inside them.',
      icon: BrainCircuit,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      features: [
        'Extracts and analyzes text from PDF, DOCX, TXT files',
        'Groups documents by subject and topic',
        'Suggests topic-based folder names (Java, DBMS, Finance)',
        'Review and approve the topic groupings'
      ],
      buttonText: 'Analyze Content'
    }
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          <FolderTree className="w-3.5 h-3.5" />
          <span>Organization Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How would you like to organize your files?
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Choose a tailored organization strategy that best fits your workflow and document types.
        </p>
      </div>

      {/* 3 Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <div
              key={method.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${method.iconBg} ${method.iconColor}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                    {method.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {method.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    {method.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Key Features
                  </p>
                  <ul className="space-y-2">
                    {method.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-zinc-300"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  onClick={() => onNavigate(method.id)}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer ${method.btnBg}`}
                >
                  <span>{method.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
