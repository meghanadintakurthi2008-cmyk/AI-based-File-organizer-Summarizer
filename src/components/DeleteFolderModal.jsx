import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DeleteFolderModal({
  isOpen,
  folder,
  onClose,
  onDelete,
  availableFolders = []
}) {
  const [moveToFolder, setMoveToFolder] = useState('Other Files/');

  if (!isOpen || !folder) return null;

  const hasFiles = (folder.fileCount || 0) > 0;
  // Available destination folders excluding this folder
  const validDestinations = availableFolders.filter((f) => (f.path || f) !== folder.path);

  const handleSubmit = (e) => {
    e.preventDefault();
    onDelete(folder.id, hasFiles ? moveToFolder : 'Other Files/');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Delete Custom Folder
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate max-w-xs">
                {folder.name}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          
          {hasFiles ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200">
                    Folder Contains {folder.fileCount} File{folder.fileCount > 1 ? 's' : ''}
                  </h4>
                  <p className="text-amber-700 dark:text-amber-300/90 mt-1">
                    To prevent accidental data loss, please select a safe destination to move the existing files before deleting this folder.
                  </p>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-amber-200/80 dark:border-amber-800/40">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-1.5 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Safely Move Files To:</span>
                </label>
                <select
                  value={moveToFolder}
                  onChange={(e) => setMoveToFolder(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                >
                  <option value="Other Files/">Other Files/ (Default Safe Folder)</option>
                  {validDestinations.map((f) => (
                    <option key={f.path || f} value={f.path || f}>
                      {f.name || f.path || f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-600 dark:text-zinc-300">
              <p>
                Are you sure you want to delete the folder <strong className="font-mono text-slate-900 dark:text-zinc-100">&quot;{folder.name}&quot;</strong>?
              </p>
              <p className="mt-1 text-slate-400">
                This folder is empty. Deleting it will remove it from your custom folders list.
              </p>
            </div>
          )}

          {/* Action buttons */}
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs shadow-rose-600/30 transition-all cursor-pointer"
            >
              {hasFiles ? 'Move Files & Delete Folder' : 'Delete Folder'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
