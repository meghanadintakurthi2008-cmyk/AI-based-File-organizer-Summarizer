import React, { useState } from 'react';
import { X, FolderPlus, Folder, CornerDownRight } from 'lucide-react';

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
  existingFolders = []
}) {
  const [folderName, setFolderName] = useState('');
  const [parentPath, setParentPath] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const quickSuggestions = [
    'My College Notes',
    'Semester 3',
    'Personal Documents',
    'Project Files',
    'Important Certificates'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      setError('Please enter a valid folder name');
      return;
    }
    const isDuplicate = existingFolders.some(
      (f) => (f.name || '').trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setError(`A folder named "${trimmed}" already exists. Please choose a different name.`);
      return;
    }
    setError('');
    onCreateFolder(trimmed, parentPath || null);
    setFolderName('');
    setParentPath('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FolderPlus className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Create New Folder
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Define a custom destination for your organized files
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          
          {/* Folder Name Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-1.5">
              Folder Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Folder className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. My College Notes, Semester 3..."
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
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

          {/* Quick Suggestions */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1.5">
              Quick Suggestions:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setFolderName(suggestion);
                    if (error) setError('');
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Parent Folder */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <span>Parent Folder</span>
              <span className="text-[10px] font-normal text-slate-400 lowercase">(optional subfolder location)</span>
            </label>
            <div className="relative">
              <CornerDownRight className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={parentPath}
                onChange={(e) => setParentPath(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="">None (Top-level folder)</option>
                {existingFolders.map((f) => (
                  <option key={f.path || f.id || f} value={f.path || f}>
                    {f.name || f.path || f}
                  </option>
                ))}
              </select>
            </div>
            {parentPath && (
              <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                Will be placed at: {parentPath}{folderName ? `${folderName.trim()}/` : ''}
              </p>
            )}
          </div>

          {/* Actions */}
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
              Create Folder
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
