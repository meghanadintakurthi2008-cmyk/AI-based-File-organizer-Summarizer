import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  FolderTree, 
  FileText,
  ChevronDown,
  ChevronUp,
  Cpu,
  Binary
} from 'lucide-react';

export default function FileInspectionModal({ 
  file, 
  onClose, 
  onApproveMove, 
  onReassign 
}) {
  const [showTechnical, setShowTechnical] = useState(false);

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 truncate">
                {file.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                <span>{file.format} • {file.size}</span>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {file.ingestionMethod === 'Full Text NLP' ? 'Content Analysis' : file.ingestionMethod === 'OCR Extracted' ? 'Scanned Document' : 'File Info Only'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-zinc-300">
          
          {/* Recommendation Summary */}
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                Target Folder Suggestion
              </span>
              <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {file.confidence}% Match
              </span>
            </div>

            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-mono font-medium text-xs">
              <FolderTree className="w-4 h-4 shrink-0" />
              <span className="truncate">{file.recommendedFolder}</span>
            </div>

            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed text-[11px] pt-1 border-t border-indigo-100/60 dark:border-indigo-900/40">
              {file.confidenceReason}
            </p>
          </div>

          {/* Alternative Candidates */}
          {file.alternativeSuggestions && file.alternativeSuggestions.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-zinc-100 mb-1.5 text-xs">
                Alternative Folders
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {file.alternativeSuggestions.map((alt, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40">
                    <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-slate-800 dark:text-zinc-200">
                      <span className="truncate">{alt.folder}</span>
                      <span className="text-slate-500 ml-1">{alt.confidence}%</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{alt.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Preview Snippet */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-zinc-100 mb-1.5 text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Document Text Preview
            </h4>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap select-all max-h-36 overflow-y-auto">
              {file.excerpt || "No text content available."}
            </div>
          </div>

          {/* Collapsible Advanced AI Technical Section */}
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowTechnical(!showTechnical)}
              className="flex items-center justify-between w-full py-1 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                {showTechnical ? 'Hide Technical Details' : 'Show Advanced Details (TF-IDF & Centroid Weights)'}
              </span>
              {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechnical && (
              <div className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 space-y-3 animate-in fade-in">
                <div>
                  <h5 className="font-mono text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                    <Binary className="w-3 h-3" />
                    Top TF-IDF Term Weights
                  </h5>
                  <div className="space-y-1.5">
                    {file.topTokens && file.topTokens.length > 0 ? (
                      file.topTokens.map((token, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-32 font-mono text-[10px] text-slate-700 dark:text-zinc-300 truncate">
                            {token.term}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.round(token.weight * 100)}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-[10px] text-slate-500">
                            {token.weight.toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-[10px] italic">No token weights computed.</p>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-200 dark:border-zinc-800">
                  Classifier: Cosine dot product with L2-normalized centroid vectors across 5,000 dictionary features.
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onReassign(file);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Change Target Folder
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
            >
              Close
            </button>
            <button
              onClick={() => {
                onApproveMove(file.id, file.recommendedFolder);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve & Move</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
