import React, { useState } from 'react';
import { X, Folder, Check, Edit3 } from 'lucide-react';

export default function ReassignModal({ 
  file, 
  onClose, 
  onConfirmReassign,
  existingFolders
}) {
  const [selectedFolder, setSelectedFolder] = useState(file?.recommendedFolder || '/Academics/Fall_2026/AI/');
  const [customPath, setCustomPath] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  if (!file) return null;

  const defaultFolders = existingFolders || [
    '/Academics/Fall_2026/AI/',
    '/Academics/Fall_2026/Distributed_Systems/',
    '/Academics/Fall_2026/Quantum_Computing/',
    '/Academics/Research_Archives/',
    '/Finance/Invoices_2026/',
    '/Finance/Tax_Filings/',
    '/Finance/Payroll_Summaries/',
    '/Legal/Master_Service_Agreements/',
    '/Legal/NDAs_Signed/',
    '/Engineering/Architecture_Specs/',
    '/Engineering/API_Documentation/',
    '/Hardware/Circuits/',
    '/Unorganized_Inbox/'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalFolder = isCustom && customPath.trim() ? customPath.trim() : selectedFolder;
    onConfirmReassign(file.id, finalFolder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Reassign Target Folder
              </h3>
              <p className="text-xs text-zinc-500 truncate max-w-xs">
                {file.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Select Destination Directory
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 bg-zinc-50/50 dark:bg-zinc-950/50">
              {defaultFolders.map((fPath) => {
                const isCurrent = !isCustom && selectedFolder === fPath;
                return (
                  <button
                    key={fPath}
                    type="button"
                    onClick={() => {
                      setSelectedFolder(fPath);
                      setIsCustom(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left font-mono transition-colors ${
                      isCurrent
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-amber-500'}`} />
                      <span className="truncate">{fPath}</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Or Type Custom Path */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Or Enter Custom Folder Path
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="/Archive/Custom_2026/Subfolder/"
                value={customPath}
                onChange={(e) => {
                  setCustomPath(e.target.value);
                  setIsCustom(true);
                }}
                onFocus={() => setIsCustom(true)}
                className={`flex-1 px-3 py-2 rounded-lg border font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-colors ${
                  isCustom ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Confirm Reassignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
