import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Loader2, 
  SlidersHorizontal
} from 'lucide-react';

export default function IngestionZone({ 
  onProcessFiles, 
  isProcessing,
  processingStage,
  currentProcessingFile,
  onOpenAiStatus
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
      onProcessFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onProcessFiles(Array.from(e.target.files));
    }
  };

  // Human-friendly stage description without heavy jargon
  const getStageLabel = (stage) => {
    switch (stage) {
      case 1:
        return 'Reading & extracting document text...';
      case 2:
        return 'Analyzing topics & content...';
      case 3:
        return 'Finding best matching folder...';
      default:
        return 'Processing file...';
    }
  };

  return (
    <div className="mb-5">
      {/* Active Processing Banner (Subtle & Clean) */}
      {isProcessing && currentProcessingFile && (
        <div className="mb-3 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate block">
                {currentProcessingFile.name}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                {getStageLabel(processingStage)}
              </span>
            </div>
          </div>
          
          <button
            onClick={onOpenAiStatus}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 font-medium ml-2"
          >
            <span>View AI Stages</span>
          </button>
        </div>
      )}

      {/* Clean Single Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20 scale-[0.99]'
            : 'border-slate-300 dark:border-zinc-700/80 hover:border-slate-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900/60 hover:bg-slate-50/50 dark:hover:bg-zinc-900/80 shadow-2xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.xlsx,.csv"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5 ring-1 ring-indigo-500/20">
          <UploadCloud className="w-5 h-5" />
        </div>

        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
          Drop files here to organize, or <span className="text-indigo-600 dark:text-indigo-400 hover:underline">browse from computer</span>
        </h3>
        
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md">
          Supports PDF, Word (.docx), text files, scanned images, and spreadsheets. Files are analyzed automatically to suggest the right folder.
        </p>

        {/* Footer with supported formats and AI status link */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 w-full max-w-lg flex items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-slate-400">
            Upload files to generate instant folder recommendations
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAiStatus();
            }}
            className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>AI Status Details</span>
          </button>
        </div>

      </div>
    </div>
  );
}
