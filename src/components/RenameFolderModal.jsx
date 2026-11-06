import React, { useState } from 'react';
import { X, Edit3, Folder } from 'lucide-react';

export default function RenameFolderModal({
  isOpen,
  folder,
  onClose,
  onRename
}) {
  const [prevFolderId, setPrevFolderId] = useState(folder?.id);
  const [newName, setNewName] = useState(folder?.name || '');
  const [error, setError] = useState('');

  if (folder && folder.id !== prevFolderId) {
    setPrevFolderId(folder.id);
    setNewName(folder.name || '');
    setError('');
  }

  if (!isOpen || !folder) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Folder name cannot be blank');
      return;
    }
    onRename(folder.id, trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Edit3 className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Rename Folder
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate max-w-xs">
                {folder.path}
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-1.5">
              New Folder Name
            </label>
            <div className="relative">
              <Folder className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
            {error && (
              <p className="mt-1 text-xs text-rose-500">{error}</p>
            )}
          </div>

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
              Save New Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
