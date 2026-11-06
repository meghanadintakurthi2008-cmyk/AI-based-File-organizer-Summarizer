import React from 'react';
import { 
  FolderCheck, 
  ShieldCheck, 
  FolderTree, 
  Check, 
  X,
  FileText
} from 'lucide-react';

export default function OrganizeConfirmModal({
  isOpen,
  file,
  batchFiles = [],
  onClose,
  onConfirm
}) {
  if (!isOpen) return null;

  const isBatch = batchFiles.length > 0;
  const count = isBatch ? batchFiles.length : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FolderCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Confirm Organization
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Review folder destination before moving
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* File details card */}
          {!isBatch && file && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-zinc-800/60 text-slate-600 dark:text-zinc-400">
                <span>Category: <strong className="text-slate-900 dark:text-zinc-200">{file.predictedCategory}</strong></span>
                <span>Confidence: <strong className="text-emerald-600 dark:text-emerald-400">{file.confidence}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                <FolderTree className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{file.recommendedFolder}</span>
              </div>
            </div>
          )}

          {isBatch && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/80 space-y-2 text-xs">
              <p className="font-semibold text-slate-900 dark:text-zinc-100">
                Ready to organize {count} selected files:
              </p>
              <ul className="max-h-32 overflow-y-auto space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                {batchFiles.map((bf) => (
                  <li key={bf.id} className="flex items-center justify-between truncate py-0.5">
                    <span className="truncate pr-2">• {bf.name}</span>
                    <span className="font-mono text-emerald-600 shrink-0 text-[10px]">
                      → {bf.recommendedFolder}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Notice: Never delete, handles duplicate files safely */}
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200 block">
                Safe Move Guarantee
              </span>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                Files are <strong>never deleted</strong>. If a file with the same name already exists in the target folder, it will be safely renamed (e.g. <code>filename (1).pdf</code>).
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Do you want to proceed and organize {isBatch ? `${count} files` : 'this file'} now?
          </p>

        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-zinc-950/50 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-200/80 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm & Organize</span>
          </button>
        </div>

      </div>
    </div>
  );
}
