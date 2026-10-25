import React from 'react';
import { 
  X, 
  Sparkles, 
  Cpu, 
  Binary, 
  Check, 
  FolderTree, 
  FileText
} from 'lucide-react';

export default function FileInspectionModal({ 
  file, 
  onClose, 
  onApproveMove, 
  onReassign 
}) {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {file.name}
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                <span>{file.format} • {file.size}</span>
                <span>•</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                  {file.ingestionMethod}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-zinc-700 dark:text-zinc-300">
          
          {/* AI Decision Summary Card */}
          <div className="p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Inference Rationale & Cosine Alignment
              </span>
              <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {file.confidence}% Confidence
              </span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {file.confidenceReason}
            </p>
            <div className="pt-2 flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-mono font-medium">
              <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
              <span>Target: {file.recommendedFolder}</span>
            </div>
          </div>

          {/* TF-IDF Top Weighted Tokens */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Binary className="w-3.5 h-3.5 text-zinc-400" />
              Top TF-IDF Extracted Tokens & Weights
            </h4>
            <div className="space-y-2">
              {file.topTokens && file.topTokens.length > 0 ? (
                file.topTokens.map((token, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-36 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                      {token.term}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        style={{ width: `${Math.round(token.weight * 100)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] text-zinc-500">
                      {token.weight.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400 italic">No text tokens available for this file format.</p>
              )}
            </div>
          </div>

          {/* Raw Document Excerpt / OCR Snippet */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1.5 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Parsed Content Excerpt
            </h4>
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap select-all">
              {file.excerpt}
            </div>
          </div>

          {/* Alternative Candidates */}
          {file.alternativeSuggestions && file.alternativeSuggestions.length > 0 && (
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1.5 uppercase text-[11px] tracking-wider">
                Secondary Centroid Matches
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {file.alternativeSuggestions.map((alt, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
                    <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                      <span className="truncate">{alt.folder}</span>
                      <span className="text-zinc-500 ml-1">{alt.confidence}%</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">{alt.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onReassign(file);
            }}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Reassign Target Folder
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Close
            </button>
            <button
              onClick={() => {
                onApproveMove(file.id, file.recommendedFolder);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve & Move Now</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
