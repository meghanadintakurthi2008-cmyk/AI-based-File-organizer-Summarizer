import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  Layers,
  BookOpen,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function SummarizeModal({
  isOpen,
  file,
  onClose
}) {
  const [mode, setMode] = useState('short'); // 'short' or 'detailed'
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) return;

    let isCurrent = true;
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.summarizeFile(file.id, mode);
        if (isCurrent) {
          setSummaryData(data);
        }
      } catch (err) {
        if (isCurrent) {
          setError(err.message || 'Failed to generate document summary.');
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    fetchSummary();

    return () => {
      isCurrent = false;
    };
  }, [isOpen, file, mode]);

  if (!isOpen || !file) return null;

  const handleCopy = () => {
    if (summaryData?.summary) {
      navigator.clipboard.writeText(summaryData.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>AI Document Summary</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  {file.predictedCategory}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-md">
                {file.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Short vs Detailed) */}
        <div className="px-6 py-3 bg-slate-50/70 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-zinc-800/80 p-1 rounded-xl">
            <button
              onClick={() => setMode('short')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                mode === 'short'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              Short Summary
            </button>
            <button
              onClick={() => setMode('detailed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                mode === 'detailed'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              Detailed Breakdown
            </button>
          </div>

          {summaryData?.supported && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-500">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
              <p className="text-sm font-medium">
                Extracting readable text & generating {mode} summary...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Summarization Error</span>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          ) : summaryData && !summaryData.supported ? (
            /* Clear Unsupported Format Message */
            <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Format Not Supported for Text Summarization</span>
              </div>
              <p className="text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                {summaryData.message}
              </p>
            </div>
          ) : summaryData ? (
            <div className="space-y-4">
              
              {/* Document Overview Metadata Pills */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {summaryData.metadata?.page_count && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium">
                    📄 {summaryData.metadata.page_count} Pages
                  </span>
                )}
                {summaryData.metadata?.row_count && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/60">
                    📊 {summaryData.metadata.row_count?.toLocaleString()} Rows
                  </span>
                )}
                {summaryData.metadata?.slide_count && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/60">
                    📽️ {summaryData.metadata.slide_count} Slides
                  </span>
                )}
                {summaryData.metadata?.dimensions && (
                  <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium border border-purple-200/60">
                    🖼️ {summaryData.metadata.dimensions}
                  </span>
                )}
                {summaryData.wordCount > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200/60">
                    ✍️ {summaryData.wordCount?.toLocaleString()} Words Analyzed
                  </span>
                )}
              </div>

              {/* Main Summary Narrative */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Executive Summary</span>
                </h4>
                <div className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-sans">
                  {summaryData.summary}
                </div>
              </div>

              {/* Key Takeaways Bullet List */}
              {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Key Takeaways & Structure</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
                    {summaryData.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-950/50 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Real text extraction • Confidential on-device analysis
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
