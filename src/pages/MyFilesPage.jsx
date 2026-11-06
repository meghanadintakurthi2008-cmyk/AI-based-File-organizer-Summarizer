import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Search,
  Folder,
  FolderPlus,
  Download,
  Edit2,
  Move,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../services/api';

export default function MyFilesPage({ onNavigate, onShowToast }) {
  const [allFiles, setAllFiles] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals / Dialogs
  const [renameTarget, setRenameTarget] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [moveTarget, setMoveTarget] = useState(null);
  const [targetFolderChoice, setTargetFolderChoice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [filesRes, treeRes] = await Promise.allSettled([
        api.getAllFiles(),
        api.getFolderTree()
      ]);

      if (filesRes.status === 'fulfilled' && Array.isArray(filesRes.value)) {
        setAllFiles(filesRes.value);
      }
      if (treeRes.status === 'fulfilled' && Array.isArray(treeRes.value)) {
        setFolderTree(treeRes.value);
      }
    } catch (err) {
      console.error('Failed to load files data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Category counts
  const getCategoryCount = (catName) => {
    if (catName === 'All') return allFiles.length;
    if (catName === 'PDF Documents') return allFiles.filter((f) => (f.predictedCategory || '').includes('PDF')).length;
    if (catName === 'Word Documents') return allFiles.filter((f) => (f.predictedCategory || '').includes('Word')).length;
    if (catName === 'Excel Files') return allFiles.filter((f) => (f.predictedCategory || '').includes('Excel')).length;
    if (catName === 'PowerPoint Files') return allFiles.filter((f) => (f.predictedCategory || '').includes('PowerPoint')).length;
    if (catName === 'Images') return allFiles.filter((f) => (f.predictedCategory || '').includes('Image')).length;
    if (catName === 'Other Files') return allFiles.filter((f) => (f.predictedCategory || '').includes('Other') || !f.predictedCategory).length;
    return allFiles.filter((f) => f.recommendedFolder === catName || f.recommendedFolder === `${catName}/`).length;
  };

  // Filter files
  const filteredFiles = allFiles.filter((f) => {
    // Category match
    let matchesCategory = true;
    if (selectedCategory === 'PDF Documents') matchesCategory = (f.predictedCategory || '').includes('PDF');
    else if (selectedCategory === 'Word Documents') matchesCategory = (f.predictedCategory || '').includes('Word');
    else if (selectedCategory === 'Excel Files') matchesCategory = (f.predictedCategory || '').includes('Excel');
    else if (selectedCategory === 'PowerPoint Files') matchesCategory = (f.predictedCategory || '').includes('PowerPoint');
    else if (selectedCategory === 'Images') matchesCategory = (f.predictedCategory || '').includes('Image');
    else if (selectedCategory === 'Other Files') matchesCategory = (f.predictedCategory || '').includes('Other') || !f.predictedCategory;
    else if (selectedCategory !== 'All') {
      matchesCategory = f.recommendedFolder === selectedCategory || f.recommendedFolder === `${selectedCategory}/`;
    }

    // Search query match
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchesSearch =
        (f.name || '').toLowerCase().includes(q) ||
        (f.predictedCategory || '').toLowerCase().includes(q) ||
        (f.recommendedFolder || '').toLowerCase().includes(q);
    }

    return matchesCategory && matchesSearch;
  });

  // Action handlers
  const handleDownload = (file) => {
    try {
      api.downloadFile(file.id, file.name);
      onShowToast('Download Started', `Downloading ${file.name}`, 'info');
    } catch (err) {
      onShowToast('Download Failed', err.message || 'Error downloading file', 'error');
    }
  };

  const handleOpenRename = (file) => {
    setRenameTarget(file);
    setNewFileName(file.name);
  };

  const handleSaveRename = async () => {
    if (!renameTarget || !newFileName.trim()) return;
    try {
      await api.renameFile(renameTarget.id, newFileName.trim());
      onShowToast('Renamed', `File renamed to "${newFileName.trim()}"`, 'success');
      setRenameTarget(null);
      await loadData();
    } catch (err) {
      onShowToast('Rename Error', err.message || 'Could not rename file', 'error');
    }
  };

  const handleOpenMove = (file) => {
    setMoveTarget(file);
    setTargetFolderChoice(file.recommendedFolder || 'Other Files/');
  };

  const handleSaveMove = async () => {
    if (!moveTarget || !targetFolderChoice.trim()) return;
    try {
      await api.moveFile(moveTarget.id, targetFolderChoice.trim());
      onShowToast('File Moved', `Moved "${moveTarget.name}" to ${targetFolderChoice.trim()}`, 'success');
      setMoveTarget(null);
      await loadData();
    } catch (err) {
      onShowToast('Move Error', err.message || 'Could not move file', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteFile(confirmDelete.id);
      onShowToast('File Deleted', `Deleted "${confirmDelete.name}" permanently`, 'success');
      setConfirmDelete(null);
      await loadData();
    } catch (err) {
      onShowToast('Delete Error', err.message || 'Could not delete file', 'error');
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName.trim());
      onShowToast('Folder Created', `Created folder "${newFolderName.trim()}"`, 'success');
      setNewFolderName('');
      setIsCreatingFolder(false);
      await loadData();
    } catch (err) {
      onShowToast('Error', err.message || 'Could not create folder', 'error');
    }
  };

  const getFileIcon = (format = '', ext = '') => {
    const extLower = (ext || '').toLowerCase();
    const fmt = (format || '').toLowerCase();
    if (fmt.includes('pdf') || extLower === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (fmt.includes('word') || ['doc', 'docx'].includes(extLower)) return <FileText className="w-4 h-4 text-blue-500" />;
    if (fmt.includes('excel') || ['xls', 'xlsx', 'csv'].includes(extLower)) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (fmt.includes('powerpoint') || ['ppt', 'pptx'].includes(extLower)) return <FileText className="w-4 h-4 text-amber-500" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extLower)) return <ImageIcon className="w-4 h-4 text-purple-500" />;
    if (['py', 'js', 'ts', 'html'].includes(extLower)) return <FileCode className="w-4 h-4 text-sky-500" />;
    if (['mp4', 'mov'].includes(extLower)) return <Video className="w-4 h-4 text-pink-500" />;
    if (['mp3', 'wav'].includes(extLower)) return <Music className="w-4 h-4 text-teal-500" />;
    if (['zip', 'rar'].includes(extLower)) return <Archive className="w-4 h-4 text-amber-600" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const standardCategories = [
    'All',
    'PDF Documents',
    'Word Documents',
    'Excel Files',
    'PowerPoint Files',
    'Images',
    'Other Files'
  ];

  const customFolders = folderTree.filter((f) => f.isCustom);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Personal Storage
            </p>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            My Files &amp; Library
          </h1>
        </div>

        {/* Global Action: Organize shortcut */}
        <button
          onClick={() => onNavigate('organize')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Organize New Files</span>
        </button>
      </div>

      {/* Main Grid: Left Filter Sidebar vs Main Files Library */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Column (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 shadow-xs space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2 pb-2">
                File Types
              </p>
              <div className="space-y-1">
                {standardCategories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count = getCategoryCount(cat);

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <span className="truncate">{cat === 'All' ? 'All Files' : cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-indigo-700 text-white'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Folders Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between px-2 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Custom Folders
                </p>
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  title="Create folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isCreatingFolder && (
                <form onSubmit={handleCreateFolder} className="mb-2 p-2 bg-slate-50 dark:bg-zinc-800/80 rounded-xl space-y-2">
                  <input
                    type="text"
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name..."
                    className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200"
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      type="submit"
                      className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder(false)}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {customFolders.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 px-2 py-1">
                  No custom folders yet
                </p>
              ) : (
                <div className="space-y-1">
                  {customFolders.map((fld) => {
                    const isSelected = selectedCategory === fld.path;
                    const count = getCategoryCount(fld.path);

                    return (
                      <button
                        key={fld.id}
                        onClick={() => setSelectedCategory(fld.path)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Folder className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                          <span className="truncate">{fld.name}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-indigo-700 text-white'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Table Column (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Search bar & Category badge */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files by name, type, or folder..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-hidden focus:border-indigo-500 text-slate-800 dark:text-zinc-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                Viewing:
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {selectedCategory} ({filteredFiles.length})
              </span>
            </div>
          </div>

          {/* Files Table Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 dark:text-zinc-500 animate-pulse">
                Loading files library...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  No files found.
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  Upload files or select a different category to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Size</th>
                      <th className="py-3 px-3">Folder Location</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* Name & Icon */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 max-w-xs sm:max-w-md">
                            <div className="shrink-0 p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800">
                              {getFileIcon(file.format, file.ext)}
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                              {file.name}
                            </span>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                            {file.predictedCategory || file.format}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="py-3 px-3 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                          {file.size}
                        </td>

                        {/* Folder */}
                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-mono border border-slate-200/60 dark:border-zinc-700/60 whitespace-nowrap">
                            <Folder className="w-3 h-3 text-amber-500" />
                            <span>{file.recommendedFolder || 'Other Files/'}</span>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Download */}
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Rename */}
                            <button
                              onClick={() => handleOpenRename(file)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Rename File"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Move */}
                            <button
                              onClick={() => handleOpenMove(file)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Move to Folder"
                            >
                              <Move className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setConfirmDelete(file)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENAME MODAL */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Rename File
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Enter a new name for "{renameTarget.name}".
            </p>
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOVE MODAL */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Move File to Folder
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Select destination folder for "{moveTarget.name}".
            </p>
            <select
              value={targetFolderChoice}
              onChange={(e) => setTargetFolderChoice(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            >
              <option value="PDF Files/">PDF Files/</option>
              <option value="Word Files/">Word Files/</option>
              <option value="Excel Files/">Excel Files/</option>
              <option value="PowerPoint Files/">PowerPoint Files/</option>
              <option value="Image Files/">Image Files/</option>
              <option value="Code Files/">Code Files/</option>
              <option value="Other Files/">Other Files/</option>
              {customFolders.map((fld) => (
                <option key={fld.id} value={fld.path}>
                  {fld.path} (Custom)
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMoveTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMove}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                Move File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete File Permanently?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">"{confirmDelete.name}"</span>? This will remove the file from storage and cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
