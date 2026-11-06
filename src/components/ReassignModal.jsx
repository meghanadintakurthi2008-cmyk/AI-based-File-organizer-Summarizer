import React, { useState } from 'react';
import { X, Folder, Check, Edit3, FolderPlus, FolderKanban, Sparkles } from 'lucide-react';

export default function ReassignModal({ 
  file, 
  onClose, 
  onConfirmReassign,
  folderTree = [],
  onOpenCreateFolder
}) {
  const [selectedFolder, setSelectedFolder] = useState(file?.recommendedFolder || 'Other Files/');
  const [inlineNewFolder, setInlineNewFolder] = useState('');
  const [isCreatingInline, setIsCreatingInline] = useState(false);

  if (!file) return null;

  // Split into Custom Folders vs Default Categories
  const customFolders = folderTree.filter((f) => f.isCustom);
  const defaultFolders = folderTree.filter((f) => !f.isCustom);

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalFolder = selectedFolder;

    if (isCreatingInline && inlineNewFolder.trim()) {
      const clean = inlineNewFolder.trim().replace(/^\/|\/$/g, '');
      finalFolder = `${clean}/`;
    }

    if (!finalFolder.endsWith('/')) {
      finalFolder = `${finalFolder}/`;
    }

    onConfirmReassign(file.id, finalFolder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Edit3 className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Change Destination Folder
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-xs">
                {file.name}
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

        {/* Current File Metadata Info Banner */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-zinc-400">Detected Type:</span>
            <span className="font-bold text-slate-800 dark:text-zinc-200">{file.predictedCategory}</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-500 dark:text-zinc-400">Current Destination:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{file.recommendedFolder}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Quick Create Button / Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
              Select Destination Folder
            </span>
            <button
              type="button"
              onClick={() => {
                if (onOpenCreateFolder) {
                  onClose();
                  onOpenCreateFolder();
                } else {
                  setIsCreatingInline(!isCreatingInline);
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Create New Folder</span>
            </button>
          </div>

          {/* Inline Create Input if toggled */}
          {isCreatingInline && (
            <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 animate-in fade-in">
              <label className="block text-[11px] font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                New Folder Name:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. My College Notes"
                  value={inlineNewFolder}
                  onChange={(e) => setInlineNewFolder(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (inlineNewFolder.trim()) {
                      const clean = `${inlineNewFolder.trim().replace(/^\/|\/$/g, '')}/`;
                      setSelectedFolder(clean);
                      setIsCreatingInline(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Use This
                </button>
              </div>
            </div>
          )}

          {/* Section 1: User-Created Custom Folders */}
          {customFolders.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-indigo-600 dark:text-indigo-400">
                <FolderKanban className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  My Folders (Custom)
                </span>
              </div>
              <div className="space-y-1.5">
                {customFolders.map((node) => {
                  const isCurrent = !isCreatingInline && selectedFolder === node.path;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => {
                        setSelectedFolder(node.path);
                        setIsCreatingInline(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-mono text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-indigo-50/40 dark:bg-zinc-800/60 text-slate-800 dark:text-zinc-200 hover:bg-indigo-100/60 dark:hover:bg-zinc-800 border border-indigo-100 dark:border-zinc-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-indigo-500'}`} />
                        <span className="truncate">{node.path}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isCurrent ? 'bg-indigo-500 text-white' : 'bg-indigo-100 dark:bg-zinc-700 text-indigo-700 dark:text-zinc-300'
                        }`}>
                          {node.fileCount || 0} files
                        </span>
                        {isCurrent && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Default File-Type Categories */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-slate-500 dark:text-zinc-400">
              <Folder className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Default File-Type Categories
              </span>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {defaultFolders.map((node) => {
                const isCurrent = !isCreatingInline && selectedFolder === node.path;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      setSelectedFolder(node.path);
                      setIsCreatingInline(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-mono text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-zinc-950/60 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-amber-500'}`} />
                      <span className="truncate">{node.path}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}>
                        {node.fileCount || 0}
                      </span>
                      {isCurrent && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User selection reminder */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Your selected folder destination takes priority over AI file-type recommendations.</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Confirm Destination
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
