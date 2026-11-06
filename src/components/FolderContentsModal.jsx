import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderOpen, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon, 
  Code, 
  Film, 
  Music, 
  Archive, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Eye 
} from 'lucide-react';
import { api } from '../services/api';

export default function FolderContentsModal({
  folder,
  onClose,
  allFiles = [],
  onSummarizeFile,
  onInspectFile
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let active = true;
    if (!folder) return;

    api.getFolderFiles(folder.id || folder.name)
      .then((data) => {
        if (active) {
          setFiles(data || []);
          setLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          console.warn('Folder file load failed:', err);
          // Fallback to active files in local memory matching this folder or category
          const localMatches = allFiles.filter((f) => {
            if (folder.isCustom) {
              return f.recommendedFolder === folder.path && f.status !== 'dismissed';
            }
            return (f.predictedCategory === folder.name || f.recommendedFolder === folder.path) && f.status !== 'dismissed';
          }).map((f) => ({
            id: f.id,
            name: f.name,
            size: f.size,
            format: f.format,
            category: f.predictedCategory,
            status: f.status,
            folder: f.recommendedFolder,
            summarizable: f.summarizable !== false,
            timestamp: f.timestamp || 'Just now'
          }));

          if (localMatches.length > 0) {
            setFiles(localMatches);
          }
          const helpfulError = err.message && err.message.includes('Failed to fetch')
            ? 'Backend server is offline or unreachable at http://127.0.0.1:8000. Please start the backend server using "python backend/run.py".'
            : (err.message || 'Unable to connect to backend server.');
          setError(helpfulError);
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [folder, allFiles, retryNonce]);

  if (!folder) return null;

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryNonce((prev) => prev + 1);
  };

  const getFormatIcon = (category) => {
    switch (category) {
      case 'PDF Files':
        return <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-mono font-bold text-[9px] border border-rose-500/20">PDF</div>;
      case 'Word Files':
        return <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-mono font-bold text-[9px] border border-blue-500/20">DOC</div>;
      case 'Excel Files':
        return <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20"><FileSpreadsheet className="w-4 h-4" /></div>;
      case 'PowerPoint Files':
        return <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20"><Presentation className="w-4 h-4" /></div>;
      case 'Image Files':
        return <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20"><ImageIcon className="w-4 h-4" /></div>;
      case 'Code Files':
        return <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20"><Code className="w-4 h-4" /></div>;
      case 'Video Files':
        return <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20"><Film className="w-4 h-4" /></div>;
      case 'Audio Files':
        return <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center border border-teal-500/20"><Music className="w-4 h-4" /></div>;
      case 'Archive Files':
        return <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20"><Archive className="w-4 h-4" /></div>;
      default:
        return <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center border border-slate-500/20"><FileText className="w-4 h-4" /></div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-indigo-50/40 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-xs">
              <FolderOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {folder.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {files.length} file{files.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                {folder.isCustom ? `User-created custom folder: ${folder.path}` : `Default category folder: ${folder.path}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          
          {/* Error Notice with Retry Option */}
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Connection Alert
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5">
                    {error}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Loading {folder.name} contents...</span>
            </div>
          ) : files.length === 0 ? (
            /* Clear empty state message when genuine count is 0 */
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                <FolderOpen className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                No files in &quot;{folder.name}&quot; yet
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Upload files from the upload area or reassign existing files into this folder to see them organized here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {files.map((file) => {
                const isSummarizable = file.summarizable !== false;
                return (
                  <div key={file.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 px-2 rounded-xl transition-colors">
                    {/* File Meta */}
                    <div className="flex items-center gap-3 min-w-0">
                      {getFormatIcon(file.category)}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {file.size} • <span className="font-semibold text-indigo-600 dark:text-indigo-400">{file.category}</span> • {file.timestamp}
                        </p>
                      </div>
                    </div>

                    {/* Available Actions: Summarize & Inspect */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        file.status === 'approved' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60'
                      }`}>
                        {file.status === 'approved' ? 'Organized' : 'Queued'}
                      </span>

                      {/* Summarize Action */}
                      {onSummarizeFile && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSummarizeFile(file);
                          }}
                          disabled={!isSummarizable}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSummarizable
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                          }`}
                          title={isSummarizable ? 'Summarize file' : 'Format not supported for text summary'}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Summarize</span>
                        </button>
                      )}

                      {/* Preview / Inspect Action */}
                      {onInspectFile && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onInspectFile(file);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 transition-colors cursor-pointer"
                          title="Preview file details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
            <span>ZIP destination:</span>
            <code className="text-indigo-600 dark:text-indigo-400 font-bold">SmartFolder_Organized/{folder.path}</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
