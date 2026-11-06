import React, { useState, useEffect, useRef } from 'react';
import {
  FolderPlus,
  UploadCloud,
  Check,
  CheckSquare,
  Square,
  ArrowRight,
  Folder,
  Plus,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  ArrowLeft,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';

export default function OrganizeUserPage({ onNavigate, onShowToast }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [customFolders, setCustomFolders] = useState([]);
  const [fileAssignments, setFileAssignments] = useState({}); // fileId -> folderPath
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  const fileInputRef = useRef(null);

  // Load custom folders on mount
  useEffect(() => {
    loadFolders();
    loadExistingPendingFiles();
  }, []);

  const loadFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const tree = await api.getFolderTree();
      if (Array.isArray(tree)) {
        // Filter user-created folders (isCustom === true) or fallback to all folders if no custom exist yet
        const customOnly = tree.filter((f) => f.isCustom);
        setCustomFolders(customOnly.length > 0 ? customOnly : tree);
      }
    } catch (err) {
      console.error('Failed to load folder tree:', err);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const loadExistingPendingFiles = async () => {
    try {
      const recs = await api.getRecommendations({ status: 'pending' });
      if (Array.isArray(recs) && recs.length > 0) {
        setUploadedFiles(recs);
      }
    } catch (err) {
      console.warn('Pending files check:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const records = await api.uploadFiles(files);
      if (Array.isArray(records)) {
        setUploadedFiles((prev) => [...records, ...prev]);
        onShowToast('Files Uploaded', `Uploaded ${records.length} files`, 'success');
      }
    } catch (err) {
      onShowToast('Upload Failed', err.message || 'Could not upload files', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleSelectFile = (fileId) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === uploadedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(uploadedFiles.map((f) => f.id)));
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await api.createFolder(newFolderName.trim());
      onShowToast('Folder Created', `Created folder "${newFolderName.trim()}"`, 'success');
      setNewFolderName('');
      setIsCreatingFolder(false);
      await loadFolders();
    } catch (err) {
      onShowToast('Create Folder Error', err.message || 'Could not create folder', 'error');
    }
  };

  const assignSelectedToFolder = (folderPath) => {
    if (selectedFiles.size === 0) {
      onShowToast('Select Files First', 'Please select at least one file to assign', 'info');
      return;
    }

    const nextAssignments = { ...fileAssignments };
    selectedFiles.forEach((fId) => {
      nextAssignments[fId] = folderPath;
    });
    setFileAssignments(nextAssignments);
    onShowToast(
      'Files Assigned',
      `Assigned ${selectedFiles.size} file(s) to ${folderPath}`,
      'success'
    );
    setSelectedFiles(new Set());
  };

  const handleSaveAll = async () => {
    const assignedIds = Object.keys(fileAssignments);
    if (assignedIds.length === 0) {
      onShowToast('No Assignments', 'Assign files to folders before saving', 'info');
      return;
    }

    setIsSaving(true);
    let successCount = 0;

    for (const fileId of assignedIds) {
      const targetFolder = fileAssignments[fileId];
      try {
        await api.approveMove(fileId, targetFolder);
        successCount++;
      } catch (err) {
        console.error(`Error moving ${fileId}:`, err);
      }
    }

    setIsSaving(false);
    onShowToast('All Changes Saved', `Organized ${successCount} files into custom folders`, 'success');
    // Remove moved files
    setUploadedFiles((prev) => prev.filter((f) => !assignedIds.includes(f.id)));
    setFileAssignments({});
    setSelectedFiles(new Set());
    await loadFolders();
  };

  const getFileIcon = (format = '', ext = '') => {
    const extLower = (ext || '').toLowerCase();
    const fmt = (format || '').toLowerCase();
    if (fmt.includes('pdf') || extLower === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (fmt.includes('word') || ['doc', 'docx'].includes(extLower)) return <FileText className="w-4 h-4 text-blue-500" />;
    if (fmt.includes('excel') || ['xls', 'xlsx', 'csv'].includes(extLower)) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (fmt.includes('powerpoint') || ['ppt', 'pptx'].includes(extLower)) return <FileText className="w-4 h-4 text-amber-500" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extLower)) return <ImageIcon className="w-4 h-4 text-purple-500" />;
    if (['py', 'js', 'ts', 'html', 'css'].includes(extLower)) return <FileCode className="w-4 h-4 text-sky-500" />;
    if (['mp4', 'mov'].includes(extLower)) return <Video className="w-4 h-4 text-pink-500" />;
    if (['mp3', 'wav'].includes(extLower)) return <Music className="w-4 h-4 text-teal-500" />;
    if (['zip', 'rar', '7z'].includes(extLower)) return <Archive className="w-4 h-4 text-amber-600" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const assignedCount = Object.keys(fileAssignments).length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('organize')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Back to Methods"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Method 2
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              User-Defined Organization
            </h1>
          </div>
        </div>

        {/* Global Save Button */}
        {assignedCount > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Moving Files...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save All ({assignedCount} Assigned)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Grid: Upload & File Selection (1/3) vs Custom Folders (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Selectable Files (1/3 width = 4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-5 text-center bg-white dark:bg-zinc-900 hover:bg-blue-50/20 dark:hover:bg-zinc-900/80 transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-2">
              Upload files to organize
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              Click to browse your computer
            </p>
            {isUploading && (
              <p className="text-xs text-blue-600 font-semibold mt-2 animate-pulse">
                Uploading files...
              </p>
            )}
          </div>

          {/* Files List with Checkboxes */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  disabled={uploadedFiles.length === 0}
                  className="text-slate-600 dark:text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {selectedFiles.size > 0 && selectedFiles.size === uploadedFiles.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Files ({uploadedFiles.length})
                </span>
              </div>
              {selectedFiles.size > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {selectedFiles.size} selected
                </span>
              )}
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                No files uploaded yet. Upload some files above to start organizing.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 max-h-[500px] overflow-y-auto">
                {uploadedFiles.map((file) => {
                  const isChecked = selectedFiles.has(file.id);
                  const assignedTo = fileAssignments[file.id];

                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleSelectFile(file.id)}
                      className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50/60 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectFile(file.id);
                        }}
                        className="mt-0.5 shrink-0 text-slate-400 dark:text-zinc-500 hover:text-blue-600 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="mt-0.5 shrink-0">
                        {getFileIcon(file.format, file.ext)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                          <span>{file.size}</span>
                          <span>&bull;</span>
                          <span>{file.predictedCategory || file.format}</span>
                        </div>

                        {/* Assignment indicator */}
                        {assignedTo && (
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                            <Folder className="w-3 h-3 text-emerald-500" />
                            <span>Assigned: {assignedTo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Custom Folders & Assignment Cards (2/3 width = 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header & Create Folder Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-500" />
              Folders &amp; Destination Categories
            </h2>

            {!isCreatingFolder ? (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Folder</span>
              </button>
            ) : null}
          </div>

          {/* New Folder Creation Form */}
          {isCreatingFolder && (
            <form
              onSubmit={handleCreateFolder}
              className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-sm space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                New Custom Folder
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Project Specs, Invoices, Marketing"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-hidden focus:border-blue-500 text-slate-800 dark:text-zinc-200"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Folders Grid */}
          {isLoadingFolders ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 animate-pulse">
              Loading folders...
            </div>
          ) : customFolders.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center space-y-3">
              <FolderPlus className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                No custom folders created yet. Click "Create New Folder" to build your organization structure.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customFolders.map((folder) => {
                // Count files currently assigned to this folder in this session
                const sessionAssignedFiles = uploadedFiles.filter(
                  (f) => fileAssignments[f.id] === folder.path
                );

                return (
                  <div
                    key={folder.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Folder className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {folder.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 shrink-0">
                          {folder.fileCount} existing
                        </span>
                      </div>

                      {/* Files assigned in session preview */}
                      {sessionAssignedFiles.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            {sessionAssignedFiles.length} file(s) assigned:
                          </p>
                          <div className="mt-1 space-y-1">
                            {sessionAssignedFiles.slice(0, 3).map((f) => (
                              <p
                                key={f.id}
                                className="text-[11px] text-slate-600 dark:text-zinc-400 truncate"
                              >
                                &bull; {f.name}
                              </p>
                            ))}
                            {sessionAssignedFiles.length > 3 && (
                              <p className="text-[10px] text-slate-400">
                                +{sessionAssignedFiles.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => assignSelectedToFolder(folder.path)}
                      disabled={selectedFiles.size === 0}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>
                        Assign {selectedFiles.size > 0 ? `(${selectedFiles.size})` : ''} Here
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
