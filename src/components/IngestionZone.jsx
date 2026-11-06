import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Loader2, 
  FileUp
} from 'lucide-react';

export default function IngestionZone({ 
  onProcessFiles, 
  isProcessing,
  processingStage,
  currentProcessingFile,
  onOpenCreateFolder
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
      // Reset input value so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const triggerUploadPicker = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case 1:
        return 'Extracting text and file metadata...';
      case 2:
        return 'Analyzing contents with TF-IDF and rules...';
      case 3:
        return 'Matching target folder and generating recommendation...';
      default:
        return 'Processing file with AI...';
    }
  };

  return (
    <div className="mb-6">
      {/* Hidden File Input supporting multiple files across all formats */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Active Processing Banner */}
      {isProcessing && currentProcessingFile && (
        <div className="mb-3.5 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-950/40 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-slate-900 dark:text-zinc-100 truncate block text-sm">
                Analyzing: {currentProcessingFile.name}
              </span>
              <span className="text-xs text-slate-600 dark:text-zinc-400">
                {getStageLabel(processingStage)}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold shrink-0 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
            Stage {processingStage} of 3
          </span>
        </div>
      )}

      {/* Drag-and-Drop Ingestion Area with working Upload Button */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/25 scale-[0.99]'
            : 'border-slate-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 shadow-2xs'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 ring-1 ring-indigo-500/20">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
          Drag & Drop Files Here
        </h3>
        
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md leading-relaxed">
          Upload single or multiple files to automatically analyze content and recommend organized destination folders.
        </p>

        {/* Prominent Working Upload Button & Create Folder Button */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={triggerUploadPicker}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileUp className="w-4 h-4" />
            )}
            <span>Upload Files</span>
          </button>

          {onOpenCreateFolder && (
            <button
              type="button"
              onClick={onOpenCreateFolder}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/80 active:scale-95 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 shadow-xs transition-all cursor-pointer"
            >
              <span>+ Create New Folder</span>
            </button>
          )}
          
          <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:inline">
            or drop files anywhere in this box
          </span>
        </div>

        {/* Supported Formats Pills */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-zinc-800/80 w-full max-w-2xl flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
          <span className="font-semibold text-slate-600 dark:text-zinc-300">Supported Formats:</span>
          {['PDF', 'Word', 'Excel/CSV', 'PowerPoint', 'Images', 'Code', 'Text', 'Video', 'Audio', 'Archive', 'Other'].map((format) => (
            <span
              key={format}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium text-[10px]"
            >
              {format}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
