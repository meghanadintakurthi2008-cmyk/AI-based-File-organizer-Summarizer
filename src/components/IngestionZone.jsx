import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Cpu, 
  GitFork, 
  Binary, 
  Sparkles,
  Zap
} from 'lucide-react';

export default function IngestionZone({ 
  onProcessFiles, 
  processingState, 
  currentProcessingFile 
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    onProcessFiles(files);
  };

  const stages = [
    {
      id: 1,
      title: 'Extracting Text',
      subtitle: 'Parsing text stream & running optical character recognition',
      icon: Binary,
    },
    {
      id: 2,
      title: 'Running TF-IDF & Classification',
      subtitle: 'Token weighting, n-gram vectorization & Cosine scoring',
      icon: Cpu,
    },
    {
      id: 3,
      title: 'Matching Cluster Centroids',
      subtitle: 'Evaluating multi-dimensional distance to folder centroids',
      icon: GitFork,
    },
  ];

  const currentStage = processingState?.stage || 0; // 0: idle, 1: stage1, 2: stage2, 3: stage3
  const isBusy = currentStage > 0;

  return (
    <div className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        
        {/* Left: Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isBusy && fileInputRef.current?.click()}
          className={`flex-1 relative rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99] ring-2 ring-indigo-500/30'
              : 'border-zinc-300 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.xlsx,.csv"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isBusy}
          />

          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 ring-1 ring-indigo-500/30">
            <UploadCloud className="w-6 h-6 animate-pulse" />
          </div>

          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Drop files here or <span className="text-indigo-600 dark:text-indigo-400 hover:underline">browse files</span>
          </h3>
          
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            Supports PDF, DOCX, TXT, PNG, JPG, and spreadsheets. Content will be analyzed automatically for cluster routing.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">.PDF</span>
            <span className="px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">.DOCX</span>
            <span className="px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">.TXT</span>
            <span className="px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">.PNG / OCR</span>
            <span className="px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">.XLSX</span>
          </div>
        </div>

        {/* Right: Visual AI Processing Pipeline */}
        <div className="w-full lg:w-[460px] flex flex-col justify-between p-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
                  AI Processing Pipeline
                </span>
              </div>
              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                isBusy 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              }`}>
                {isBusy ? 'ACTIVE INFERENCE' : 'PIPELINE STANDBY'}
              </span>
            </div>

            {/* Currently Processing File Banner */}
            {isBusy && currentProcessingFile && (
              <div className="mb-3 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate font-mono font-medium">{currentProcessingFile.name}</span>
                </div>
                <span className="text-[10px] shrink-0 font-mono text-indigo-500">
                  {currentProcessingFile.size}
                </span>
              </div>
            )}

            {/* 3 AI Processing Stages */}
            <div className="space-y-2.5">
              {stages.map((stage) => {
                const Icon = stage.icon;
                const isCurrent = currentStage === stage.id;
                const isDone = currentStage > stage.id;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-indigo-500/50 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-sm'
                        : isDone
                        ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/30 opacity-70'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                          <Icon className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${
                          isCurrent 
                            ? 'text-indigo-600 dark:text-indigo-300' 
                            : isDone 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {stage.id}. {stage.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono text-indigo-500 animate-pulse">
                            Processing...
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-mono text-emerald-500">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {stage.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Demo Pre-load buttons */}
          <div className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Quick Ingestion Demos:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onProcessFiles([{
                  name: "deep_learning_convergence_analysis.pdf",
                  size: "3.2 MB",
                  type: "application/pdf"
                }])}
                className="px-2 py-1 text-[10px] font-medium rounded-md bg-zinc-200/70 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors disabled:opacity-50"
              >
                + AI Paper
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onProcessFiles([{
                  name: "Q4_Vendor_Billing_Breakdown.xlsx",
                  size: "890 KB",
                  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }])}
                className="px-2 py-1 text-[10px] font-medium rounded-md bg-zinc-200/70 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors disabled:opacity-50"
              >
                + Invoice
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
