import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  FolderPlus, 
  Folder, 
  FolderOpen, 
  Search, 
  Filter, 
  FileText, 
  Edit3, 
  Move, 
  Trash2, 
  Eye, 
  Download, 
  Check, 
  X, 
  ShieldCheck, 
  LayoutGrid, 
  List, 
  ChevronRight, 
  Plus, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon, 
  Code, 
  Film, 
  Music, 
  Archive,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function StorageExplorer({
  files = [],
  folderTree = [],
  onOpenCreateFolder,
  onInspectFile,
  onRefreshData,
  onDownloadZip
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [storageInfo, setStorageInfo] = useState(null);
  
  // File Action Modals
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [moveTarget, setMoveTarget] = useState(null);
  const [moveFolderSelect, setMoveFolderSelect] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load physical storage details
  useEffect(() => {
    loadStorageDetails();
  }, [files]);

  const loadStorageDetails = () => {
    api.getStorageInfo()
      .then((info) => {
        if (info) setStorageInfo(info);
      })
      .catch((err) => console.warn('Storage info error:', err));
  };

  // Filter files by folder and search
  const filteredFiles = files.filter((f) => {
    if (f.status === 'dismissed') return false;
    const matchesSearch = 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.recommendedFolder && f.recommendedFolder.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.predictedCategory && f.predictedCategory.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFolder !== 'All') {
      return (
        f.recommendedFolder === selectedFolder ||
        f.recommendedFolder === `${selectedFolder}/` ||
        f.predictedCategory === selectedFolder
      );
    }

    return true;
  });

  const getFormatIcon = (category = '') => {
    switch (category) {
      case 'PDF Files':
        return <span className="font-mono font-bold text-[9px] text-rose-500 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20">PDF</span>;
      case 'Word Files':
        return <span className="font-mono font-bold text-[9px] text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20">DOC</span>;
      case 'Excel Files':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'PowerPoint Files':
        return <Presentation className="w-4 h-4 text-amber-500" />;
      case 'Image Files':
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      case 'Code Files':
        return <Code className="w-4 h-4 text-indigo-500" />;
      case 'Archive Files':
        return <Archive className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleExecuteRename = async (e) => {
    e.preventDefault();
    if (!renameTarget || !renameInput.trim()) return;
    setActionLoading(true);
    try {
      await api.renameFile(renameTarget.id, renameInput.trim());
      setRenameTarget(null);
      setRenameInput('');
      onRefreshData?.();
    } catch (err) {
      alert(err.message || 'Failed to rename file');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteMove = async (e) => {
    e.preventDefault();
    if (!moveTarget || !moveFolderSelect) return;
    setActionLoading(true);
    try {
      await api.moveFile(moveTarget.id, moveFolderSelect);
      setMoveTarget(null);
      setMoveFolderSelect('');
      onRefreshData?.();
    } catch (err) {
      alert(err.message || 'Failed to move file');
    } finally {
      setActionLoading(false);
    }
  };

  const activeFilesCount = files.filter((f) => f.status !== 'dismissed').length;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Storage Location & Transparency Card */}
      <div className="rounded-3xl border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-cyan-50/30 to-white dark:from-blue-950/30 dark:via-zinc-900 dark:to-zinc-900 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <HardDrive className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100">
                  Personal Storage Explorer
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Option 3: Persistent Local Cloud
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Your documents are securely stored on your computer's local filesystem with SQLite metadata indexing. Files remain available after browser reloads.
              </p>
              
              {/* Storage location breadcrumb */}
              <div className="flex items-center gap-2 mt-2 font-mono text-[11px] text-slate-600 dark:text-zinc-400 bg-white/80 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Local Storage: <span className="font-bold text-slate-800 dark:text-zinc-200">{storageInfo?.storagePath || 'backend/storage/organized/'}</span></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Stored</span>
              <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 font-mono">
                {activeFilesCount} files • {storageInfo?.usedDisplay || '0 KB'}
              </span>
            </div>

            <button
              onClick={onOpenCreateFolder}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Create Folder</span>
            </button>

            <button
              onClick={onDownloadZip}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-500" />
              <span>Download ZIP</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Folder Navigation Cards & Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
        
        {/* Search & View Mode Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename, category, or folder..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400"
            />
          </div>

          {/* View Toggles & Folder Filter Pills */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-xs' : 'text-slate-400'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-xs' : 'text-slate-400'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Folder Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <button
            onClick={() => setSelectedFolder('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedFolder === 'All'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            }`}
          >
            All Stored Files ({activeFilesCount})
          </button>

          {folderTree.map((fld) => (
            <button
              key={fld.id}
              onClick={() => setSelectedFolder(fld.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedFolder === fld.name
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{fld.name}</span>
              <span className="font-mono text-[10px] opacity-75">({fld.fileCount || 0})</span>
            </button>
          ))}
        </div>

      </div>

      {/* 3. Files Display (List or Grid View) */}
      <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        
        {filteredFiles.length === 0 ? (
          <div className="py-24 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
              No files in this folder
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery ? 'No stored documents match your search criteria.' : 'Create custom folders or organize uploaded files into this directory.'}
            </p>
            {onOpenCreateFolder && (
              <button
                type="button"
                onClick={onOpenCreateFolder}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Create Custom Folder</span>
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          
          /* Table List View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-3">Name</th>
                  <th className="py-3.5 px-3">Folder Location</th>
                  <th className="py-3.5 px-3">Format & Size</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    
                    {/* Filename */}
                    <td className="py-3.5 pl-6 pr-3 font-semibold text-slate-800 dark:text-zinc-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFormatIcon(file.predictedCategory || file.format)}
                        <span className="truncate max-w-[260px] font-bold">{file.name}</span>
                      </div>
                    </td>

                    {/* Folder Path */}
                    <td className="py-3.5 px-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                      <div className="flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[220px]">{file.recommendedFolder || 'Default'}</span>
                      </div>
                    </td>

                    {/* Format & Size */}
                    <td className="py-3.5 px-3 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      <span>{file.format} • {file.size}</span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        file.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200'
                      }`}>
                        {file.status === 'approved' ? 'Stored' : 'Queued'}
                      </span>
                    </td>

                    {/* Actions: Inspect, Rename, Move */}
                    <td className="py-3.5 pr-6 pl-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onInspectFile?.(file)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Preview document details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setRenameTarget(file);
                            setRenameInput(file.name);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Rename file"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setMoveTarget(file);
                            setMoveFolderSelect(file.recommendedFolder || 'Other Files/');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Move to another folder"
                        >
                          <Move className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          
          /* Card Grid View */
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {getFormatIcon(file.predictedCategory || file.format)}
                    <span className="text-[10px] font-mono text-slate-400">{file.size}</span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 truncate mb-1" title={file.name}>
                    {file.name}
                  </h4>

                  <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
                    <Folder className="w-3 h-3 shrink-0" />
                    <span>{file.recommendedFolder || 'Root'}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800/80 mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {file.timestamp || 'Stored'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onInspectFile?.(file)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setRenameTarget(file);
                        setRenameInput(file.name);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-blue-600"
                      title="Rename"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setMoveTarget(file);
                        setMoveFolderSelect(file.recommendedFolder || 'Other Files/');
                      }}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600"
                      title="Move"
                    >
                      <Move className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        )}

      </div>

      {/* Rename File Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleExecuteRename}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Rename Document
              </h3>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                New Filename
              </label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <p className="text-[10px] text-slate-400">
                Extension will be preserved automatically if omitted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
              >
                {actionLoading ? 'Saving...' : 'Rename File'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Move File to Folder Modal */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleExecuteMove}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Move Document to Folder
              </h3>
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Select Destination Directory
              </label>
              <select
                value={moveFolderSelect}
                onChange={(e) => setMoveFolderSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono"
              >
                {folderTree.map((f) => (
                  <option key={f.id} value={f.path}>
                    {f.path} {f.isCustom ? '(Custom)' : '(Default)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
              >
                {actionLoading ? 'Moving...' : 'Move Document'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
