import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  FolderTree, 
  Check, 
  X, 
  Edit3, 
  ChevronDown, 
  Sparkles, 
  ScanLine, 
  AlertTriangle, 
  Search, 
  FolderCheck,
  CheckCheck
} from 'lucide-react';

export default function RecommendationTable({
  files,
  onApproveMove,
  onReassignFolder,
  onDismiss,
  onInspectFile,
  onApproveSelected,
  onDismissSelected,
  activeFilter,
  setActiveFilter
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // File format icon renderer
  const getFormatIcon = (format) => {
    switch (format?.toUpperCase()) {
      case 'PDF':
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/20">
            <span className="text-[10px] font-bold font-mono">PDF</span>
          </div>
        );
      case 'DOCX':
      case 'DOC':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/20">
            <span className="text-[10px] font-bold font-mono">DOC</span>
          </div>
        );
      case 'IMG':
      case 'PNG':
      case 'JPG':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/20">
            <ImageIcon className="w-4 h-4" />
          </div>
        );
      case 'SHEET':
      case 'XLSX':
      case 'CSV':
        return (
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 dark:bg-teal-500/20 flex items-center justify-center shrink-0 border border-teal-500/20">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <FileText className="w-4 h-4" />
          </div>
        );
    }
  };

  // Ingestion Method badge renderer
  const getIngestionBadge = (method) => {
    switch (method) {
      case 'Full Text NLP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            Full Text NLP
          </span>
        );
      case 'OCR Extracted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            <ScanLine className="w-3 h-3 text-indigo-500" />
            OCR Extracted
          </span>
        );
      case 'Metadata Only Fallback':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Metadata Only Fallback
          </span>
        );
    }
  };

  // Predicted category pill
  const getCategoryBadge = (category) => {
    const map = {
      'Research Papers': 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800/60',
      'Finance': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      'Lecture Notes': 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
      'Legal Contracts': 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      'Hardware Schematics': 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
      'Engineering Docs': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60',
    };

    const colorClass = map[category] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
        {category}
      </span>
    );
  };

  // Confidence bar color
  const getConfidenceColor = (conf) => {
    if (conf >= 90) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
    if (conf >= 75) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
    return { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' };
  };

  // Filter files
  const filteredFiles = files.filter((file) => {
    // Search filter
    const matchesSearch = 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.predictedCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.recommendedFolder.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Category / quick filters
    if (activeFilter === 'High Confidence') return file.confidence >= 90;
    if (activeFilter === 'Needs Review') return file.confidence < 80;
    if (activeFilter === 'Metadata Only Fallback') return file.ingestionMethod === 'Metadata Only Fallback';
    if (activeFilter === 'Pending') return file.status === 'pending';
    
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

  return (
    <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
      
      {/* Table Header & Controls Bar */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/90 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by file name, category, or path..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'All', label: 'All Files' },
            { id: 'High Confidence', label: 'High Confidence (≥90%)' },
            { id: 'Needs Review', label: 'Needs Review (<80%)' },
            { id: 'Metadata Only Fallback', label: 'Metadata Only' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === pill.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedFileIds.size > 0 && (
        <div className="bg-indigo-50/90 dark:bg-indigo-950/40 px-4 py-2 border-b border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-xs animate-in fade-in">
          <span className="font-medium text-indigo-900 dark:text-indigo-200">
            {selectedFileIds.size} file{selectedFileIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onApproveSelected(Array.from(selectedFileIds));
                setSelectedFileIds(new Set());
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Approve & Move Selected
            </button>
            <button
              onClick={() => {
                onDismissSelected(Array.from(selectedFileIds));
                setSelectedFileIds(new Set());
              }}
              className="px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-950/50 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <th className="py-3 pl-4 pr-2 w-8">
                <input
                  type="checkbox"
                  checked={filteredFiles.length > 0 && selectedFileIds.size === filteredFiles.length}
                  onChange={handleSelectAll}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3">File Details</th>
              <th className="py-3 px-3">Ingestion Method</th>
              <th className="py-3 px-3">Predicted Category</th>
              <th className="py-3 px-3 min-w-[260px]">Recommended Target Folder</th>
              <th className="py-3 px-3">Alternative Suggestions</th>
              <th className="py-3 pr-4 pl-3 text-right">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-16 text-center text-zinc-500 dark:text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FolderCheck className="w-8 h-8 text-zinc-400 dark:text-zinc-600 stroke-[1.5]" />
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      No files matching the active filter
                    </p>
                    <p className="text-xs text-zinc-400 max-w-sm">
                      Try resetting your search query or simulate new files using the top controls.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => {
                const confColor = getConfidenceColor(file.confidence);
                const isSelected = selectedFileIds.has(file.id);
                const isDropdownOpen = openDropdownId === file.id;

                return (
                  <tr 
                    key={file.id}
                    className={`group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 pl-4 pr-2 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectFile(file.id)}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* File Details: Icon, name, size, time */}
                    <td className="py-3.5 px-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        {getFormatIcon(file.format)}
                        <div className="min-w-0 max-w-[220px]">
                          <button
                            onClick={() => onInspectFile(file)}
                            className="font-medium text-zinc-900 dark:text-zinc-100 truncate block text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Click to inspect AI features & extracted keywords"
                          >
                            {file.name}
                          </button>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>{file.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Ingestion Method Badge */}
                    <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                      {getIngestionBadge(file.ingestionMethod)}
                    </td>

                    {/* Predicted Category */}
                    <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                      {getCategoryBadge(file.predictedCategory)}
                    </td>

                    {/* Recommended Target Folder & Confidence Bar */}
                    <td className="py-3.5 px-3 align-middle">
                      <div>
                        {/* Folder Breadcrumb */}
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                          <FolderTree className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{file.recommendedFolder}</span>
                        </div>

                        {/* Confidence Percentage Bar & Text */}
                        <div className="mt-1.5 flex items-center gap-2 max-w-[200px]">
                          <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${confColor.bar}`}
                              style={{ width: `${file.confidence}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-mono font-bold ${confColor.text}`}>
                            {file.confidence}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Alternative Suggestions Dropdown */}
                    <td className="py-3.5 px-3 align-middle relative">
                      {file.alternativeSuggestions && file.alternativeSuggestions.length > 0 ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdownId(isDropdownOpen ? null : file.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <span>{file.alternativeSuggestions.length} candidates</span>
                            <ChevronDown className="w-3 h-3 text-zinc-400" />
                          </button>

                          {/* Popover Menu */}
                          {isDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <div className="absolute left-0 mt-1 w-72 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95">
                                <p className="text-[10px] uppercase font-semibold text-zinc-400 px-2 py-0.5 tracking-wider">
                                  Alternative Target Centroids
                                </p>
                                {file.alternativeSuggestions.map((alt, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50"
                                  >
                                    <div className="flex items-center justify-between font-mono text-[11px]">
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                        {alt.folder}
                                      </span>
                                      <span className="text-zinc-500 shrink-0 font-bold ml-1">
                                        {alt.confidence}%
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                      {alt.reason}
                                    </p>
                                    <button
                                      onClick={() => {
                                        onApproveMove(file.id, alt.folder);
                                        setOpenDropdownId(null);
                                      }}
                                      className="mt-1.5 w-full text-center py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium transition-colors"
                                    >
                                      Assign to this folder
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">None (Strong fit)</span>
                      )}
                    </td>

                    {/* Actions: Approve & Move, Reassign Folder, Dismiss */}
                    <td className="py-3.5 pr-4 pl-3 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        
                        {/* Approve & Move */}
                        <button
                          onClick={() => onApproveMove(file.id, file.recommendedFolder)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-xs shadow-emerald-600/20 transition-all"
                          title="Approve recommendation and execute folder transfer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Move</span>
                        </button>

                        {/* Reassign Folder */}
                        <button
                          onClick={() => onReassignFolder(file)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 transition-colors"
                          title="Reassign to another directory"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Dismiss */}
                        <button
                          onClick={() => onDismiss(file.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-colors"
                          title="Dismiss recommendation"
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
      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Showing {filteredFiles.length} of {files.length} queued recommendations</span>
        <span className="font-mono text-[11px]">Auto-refresh interval: 15s</span>
      </div>

    </div>
  );
}
