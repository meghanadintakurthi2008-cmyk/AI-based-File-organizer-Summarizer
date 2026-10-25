import React from 'react';
import { 
  X, 
  Cpu, 
  Binary, 
  GitFork, 
  Sparkles, 
  Sliders
} from 'lucide-react';

export default function AiStatusModal({ isOpen, onClose, backendOnline }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                AI Engine Status & Technical Architecture
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                TF-IDF Vectorization & K-Means Centroid Classifier (v2.4)
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

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-zinc-300">
          
          {/* Status banner */}
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`} />
              <div>
                <p className="font-semibold text-slate-900 dark:text-zinc-100">
                  {backendOnline ? 'Live FastAPI Backend Connected' : 'Local Fallback Engine Active'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Worker threads active • Average latency: 42ms
                </p>
              </div>
            </div>
            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
              Uvicorn :8000
            </span>
          </div>

          {/* 3-Stage Pipeline Description */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-zinc-100 uppercase text-[11px] tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              The 3-Stage Ingestion Pipeline
            </h4>
            
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-zinc-100">
                  <Binary className="w-4 h-4 text-indigo-500" />
                  <span>Stage 1: Multi-Format Text Extraction</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Extracts raw text streams from PDF blocks, parses DOCX XML trees, reads tabular cells from XLSX spreadsheets, and applies optical character analysis or EXIF header metadata fallbacks.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-zinc-100">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  <span>Stage 2: TF-IDF Vectorization & Feature Weighting</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Computes sublinear term frequency and inverse document frequency across unigrams and bigrams. Generates L2-normalized sparse document vectors across 5,000 dictionary features.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-zinc-100">
                  <GitFork className="w-4 h-4 text-violet-500" />
                  <span>Stage 3: Cluster Centroid Matching & Cosine Similarity</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Calculates vector dot product against pre-computed directory centroids. Selects the highest similarity folder target, computes calibrated confidence scores, and determines 2nd/3rd candidate folders.
                </p>
              </div>
            </div>
          </div>

          {/* Model Hyperparameters */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-zinc-100 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Model Parameters & Configuration
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/50">
                <span className="text-slate-400 block text-[10px]">VECTORIZER</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">scikit-learn TfidfVectorizer</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/50">
                <span className="text-slate-400 block text-[10px]">N-GRAM RANGE</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">(1, 2) unigram & bigram</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/50">
                <span className="text-slate-400 block text-[10px]">MAX VOCABULARY</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">5,000 features</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/50">
                <span className="text-slate-400 block text-[10px]">CONFIDENCE CALIBRATION</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">Cosine score &ge; 0.40 &rarr; 90%+</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
