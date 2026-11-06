import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  FolderTree, 
  Check, 
  X, 
  Edit3, 
  Code, 
  Film, 
  Music,
  Archive,
  Search, 
  FolderCheck,
  CheckCheck,
  Sparkles,
  Presentation,
  Download,
  Info,
  FolderPlus
} from 'lucide-react';

export default function RecommendationTable({
  files = [],
  onSummarizeFile, // Opens the Summarize modal
  onRequestOrganize, // Opens confirmation modal for single file
  onRequestBatchOrganize, // Opens confirmation modal for batch
  onDownloadZip, // Downloads organized zip
  onReassignFolder,
  onDismiss,
  onInspectFile,
  activeCategoryFilter = 'All',
  onSelectCategory,
  onOpenCreateFolder
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());

  // Format Icon helper
  const getFormatIcon = (category) => {
    switch (category) {
      case 'PDF Files':
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20 font-mono font-bold text-[10px]">
            PDF
          </div>
        );
      case 'Word Files':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20 font-mono font-bold text-[10px]">
            DOC
          </div>
        );
      case 'Excel Files':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        );
      case 'PowerPoint Files':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Presentation className="w-4 h-4" />
          </div>
        );
      case 'Image Files':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20">
            <ImageIcon className="w-4 h-4" />
          </div>
        );
      case 'Code Files':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Code className="w-4 h-4" />
          </div>
        );
      case 'Video Files':
        return (
          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
            <Film className="w-4 h-4" />
          </div>
        );
      case 'Audio Files':
        return (
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0 border border-teal-500/20">
            <Music className="w-4 h-4" />
          </div>
        );
      case 'Archive Files':
        return (
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
            <Archive className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0 border border-slate-500/20">
            <FileText className="w-4 h-4" />
          </div>
        );
    }
  };

  // Category Badge Colors
  const getCategoryBadge = (category) => {
    const map = {
      'PDF Files': 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
      'Word Files': 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
      'Excel Files': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      'PowerPoint Files': 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      'Image Files': 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
      'Code Files': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
      'Text Files': 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
      'Video Files': 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800/60',
      'Audio Files': 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
      'Archive Files': 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
      'Other Files': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
    };
    const colorClass = map[category] || map['Other Files'];

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${colorClass}`}>
        {category}
      </span>
    );
  };

  // Filter files by search and active category card
  const filteredFiles = files.filter((file) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      file.name.toLowerCase().includes(query) ||
      file.predictedCategory.toLowerCase().includes(query) ||
      file.recommendedFolder.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (activeCategoryFilter !== 'All') {
      return file.predictedCategory === activeCategoryFilter;
    }

    return true;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedFileIds(new Set(filteredFiles.map((f) => f.id)));
    } else {
      setSelectedFileIds(new Set());
    }
  };

  const toggleSelectFile = (id) => {
    const next = new Set(selectedFileIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedFileIds(next);
  };

  const selectedFilesList = files.filter((f) => selectedFileIds.has(f.id));

  return (
    <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden flex flex-col">
      
      {/* Controls Bar: Search + Quick Category Filter */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by file name, detected type, or destination folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/80 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeCategoryFilter !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
              Filter: {activeCategoryFilter}
              <button 
                onClick={() => onSelectCategory('All')}
                className="hover:text-indigo-900 dark:hover:text-white"
              >
                ×
              </button>
            </span>
          )}

          {onOpenCreateFolder && (
            <button
              onClick={onOpenCreateFolder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
              title="Create a new custom folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Create New Folder</span>
            </button>
          )}

          <button
            onClick={onDownloadZip}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
            title="Download all organized files as a ZIP package"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Download Organized (ZIP)</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when files selected) */}
      {selectedFileIds.size > 0 && (
        <div className="bg-indigo-50/90 dark:bg-indigo-950/50 px-4 py-2.5 border-b border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-xs animate-in fade-in">
          <span className="font-semibold text-indigo-950 dark:text-indigo-200">
            {selectedFileIds.size} file{selectedFileIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRequestBatchOrganize(selectedFilesList);
                setSelectedFileIds(new Set());
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Approve & Organize Selected
            </button>
            <button
              onClick={() => setSelectedFileIds(new Set())}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium cursor-pointer"
            >
              Cancel Selection
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              <th className="py-3.5 pl-4 pr-2 w-8">
                <input
                  type="checkbox"
                  checked={filteredFiles.length > 0 && selectedFileIds.size === filteredFiles.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-3">File Name</th>
              <th className="py-3.5 px-3">Detected Type</th>
              <th className="py-3.5 px-3 min-w-[200px]">Recommended Folder</th>
              <th className="py-3.5 px-3">Size & Details</th>
              <th className="py-3.5 pr-4 pl-3 text-right min-w-[260px]">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/60">
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center text-slate-500 dark:text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-500 flex items-center justify-center">
                      <FolderCheck className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    {files.length === 0 ? (
                      <>
                        {/* Requirement empty state */}
                        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                          No files uploaded yet. Upload files to start AI analysis.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Upload files using the drag-and-drop area or upload button above.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                          No files matching active filter
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Clear search or switch category cards above.
                        </p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedFileIds.has(file.id);
                const isSummarizable = file.summarizable !== false;

                return (
                  <tr 
                    key={file.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 pl-4 pr-2 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectFile(file.id)}
                        className="rounded border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* File Name */}
                    <td className="py-3.5 px-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        {getFormatIcon(file.predictedCategory, file.format)}
                        <div className="min-w-0 max-w-[220px]">
                          <button
                            onClick={() => onInspectFile(file)}
                            className="font-bold text-slate-900 dark:text-zinc-100 truncate block text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                            title="Click to preview file details"
                          >
                            {file.name}
                          </button>
                          <span className="text-[11px] text-slate-400 font-mono">
                            .{file.ext?.toUpperCase() || file.format}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Detected Type */}
                    <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                      {getCategoryBadge(file.predictedCategory)}
                    </td>

                    {/* Recommended Folder */}
                    <td className="py-3.5 px-3 align-middle font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <FolderTree className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{file.recommendedFolder}</span>
                      </div>
                    </td>

                    {/* Size & Details */}
                    <td className="py-3.5 px-3 align-middle font-mono text-xs text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      <span>{file.size}</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span>{file.timestamp}</span>
                    </td>

                    {/* Actions: Summarize & Organize */}
                    <td className="py-3.5 pr-4 pl-3 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        
                        {/* Requirement 3: On-Demand Summarize Action */}
                        <button
                          onClick={() => onSummarizeFile(file)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSummarizable
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/20 active:scale-95'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                          }`}
                          title={isSummarizable ? 'Generate concise or detailed AI summary' : 'Format not supported for text summary'}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Summarize</span>
                        </button>

                        {/* Requirement 2: Approve & Organize Button */}
                        <button
                          onClick={() => onRequestOrganize(file)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
                          title="Approve recommendation and organize into type folder"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Approve & Organize</span>
                        </button>

                        {/* Reassign Target Folder */}
                        <button
                          onClick={() => onReassignFolder(file)}
                          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 transition-colors cursor-pointer"
                          title="Reassign folder"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Dismiss */}
                        <button
                          onClick={() => onDismiss(file.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Dismiss file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
        <span>Showing {filteredFiles.length} of {files.length} queued files</span>
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>Files are safely organized in type-based folders with duplicate preservation.</span>
        </div>
      </div>

    </div>
  );
}
