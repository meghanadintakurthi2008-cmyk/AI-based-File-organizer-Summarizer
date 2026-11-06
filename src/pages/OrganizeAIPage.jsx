import React, { useState, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  ArrowRight,
  FolderTree,
  CheckCircle2,
  HardDrive,
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
  Edit2
} from 'lucide-react';
import { api } from '../services/api';

export default function OrganizeAIPage({ onNavigate, onShowToast }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [editedFolders, setEditedFolders] = useState({});
  const [approvalState, setApprovalState] = useState('idle'); // 'idle' | 'reviewing' | 'confirmed'
  const [isUploading, setIsUploading] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizeProgress, setOrganizeProgress] = useState({ current: 0, total: 0 });

  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    await processFiles(files);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length === 0) return;
    await processFiles(files);
  };

  const processFiles = async (fileList) => {
    setIsUploading(true);
    try {
      const records = await api.uploadFiles(fileList);
      if (Array.isArray(records) && records.length > 0) {
        setUploadedFiles(records);
        // Pre-fill editedFolders map
        const initialMap = {};
        records.forEach((r) => {
          initialMap[r.id] = r.recommendedFolder || 'Other Files/';
        });
        setEditedFolders(initialMap);
        setApprovalState('reviewing');
        onShowToast('Files Ingested', `AI analyzed ${records.length} files successfully`, 'success');
      } else {
        onShowToast('Notice', 'No files could be processed', 'info');
      }
    } catch (err) {
      console.error('Upload error:', err);
      onShowToast('Upload Failed', err.message || 'Error uploading files', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFolderChange = (fileId, newFolder) => {
    setEditedFolders((prev) => ({
      ...prev,
      [fileId]: newFolder
    }));
  };

  const handleConfirmAndOrganize = async () => {
    if (uploadedFiles.length === 0) return;

    setIsOrganizing(true);
    setOrganizeProgress({ current: 0, total: uploadedFiles.length });

    let successCount = 0;
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const targetFolder = (editedFolders[file.id] || file.recommendedFolder || 'Other Files/').trim();
      const formattedTarget = targetFolder.endsWith('/') ? targetFolder : `${targetFolder}/`;

      try {
        await api.approveMove(file.id, formattedTarget);
        successCount++;
      } catch (err) {
        console.error(`Failed to move ${file.name}:`, err);
      }
      setOrganizeProgress({ current: i + 1, total: uploadedFiles.length });
    }

    setIsOrganizing(false);
    setApprovalState('confirmed');
    onShowToast(
      'Organization Complete',
      `Successfully organized ${successCount} of ${uploadedFiles.length} files into smart folders`,
      'success'
    );
  };

  const handleReset = () => {
    setUploadedFiles([]);
    setEditedFolders({});
    setApprovalState('idle');
  };

  const getFileIcon = (format = '', ext = '') => {
    const extLower = (ext || '').toLowerCase();
    const fmt = (format || '').toLowerCase();

    if (fmt.includes('pdf') || extLower === 'pdf') return <FileText className="w-5 h-5 text-rose-500" />;
    if (fmt.includes('word') || ['doc', 'docx'].includes(extLower)) return <FileText className="w-5 h-5 text-blue-500" />;
    if (fmt.includes('excel') || ['xls', 'xlsx', 'csv'].includes(extLower)) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (fmt.includes('powerpoint') || ['ppt', 'pptx'].includes(extLower)) return <FileText className="w-5 h-5 text-amber-500" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extLower)) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (['py', 'js', 'ts', 'html', 'css'].includes(extLower)) return <FileCode className="w-5 h-5 text-sky-500" />;
    if (['mp4', 'mov'].includes(extLower)) return <Video className="w-5 h-5 text-pink-500" />;
    if (['mp3', 'wav'].includes(extLower)) return <Music className="w-5 h-5 text-teal-500" />;
    if (['zip', 'rar', '7z'].includes(extLower)) return <Archive className="w-5 h-5 text-amber-600" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
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
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Method 1
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              AI-Recommended Organization
            </h1>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-zinc-500">
          <span
            className={`px-2 py-0.5 rounded-full ${
              approvalState === 'idle'
                ? 'bg-violet-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}
          >
            1. Upload
          </span>
          <span>&rarr;</span>
          <span
            className={`px-2 py-0.5 rounded-full ${
              approvalState === 'reviewing'
                ? 'bg-violet-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}
          >
            2. Review
          </span>
          <span>&rarr;</span>
          <span
            className={`px-2 py-0.5 rounded-full ${
              approvalState === 'confirmed'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}
          >
            3. Complete
          </span>
        </div>
      </div>

      {/* STEP 1: Upload Files Dropzone */}
      {approvalState === 'idle' && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-violet-500 dark:hover:border-violet-500 rounded-2xl p-10 text-center bg-white dark:bg-zinc-900 hover:bg-violet-50/20 dark:hover:bg-zinc-900/80 transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                Click to upload files or drag &amp; drop
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Supports all files: Documents, Spreadsheets, Presentations, Code, Images &amp; Media
              </p>
            </div>
            {isUploading && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-violet-600 dark:text-violet-400 font-semibold animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI analyzing and categorizing uploaded files...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Review Suggestions */}
      {approvalState === 'reviewing' && (
        <div className="space-y-6">
          <div className="bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-violet-950 dark:text-violet-200">
                  AI Suggestions Ready for Review
                </h3>
                <p className="text-xs text-violet-700 dark:text-violet-400">
                  You can edit any folder name below before confirming. Click the folder name to customize.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-600 text-white">
              {uploadedFiles.length} files
            </span>
          </div>

          {/* Files List with Editable Folder Inputs */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800 shadow-xs">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* File info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 shrink-0">
                    {getFileIcon(file.format, file.ext)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                      <span className="font-medium text-slate-600 dark:text-zinc-400">
                        {file.size}
                      </span>
                      <span>&bull;</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-600 dark:text-zinc-300">
                        {file.predictedCategory || file.format}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow and Editable Target Folder */}
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                  <div className="flex-1 relative">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
                      Recommended Folder (Editable)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editedFolders[file.id] ?? file.recommendedFolder}
                        onChange={(e) => handleFolderChange(file.id, e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 pr-8 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-800 dark:text-zinc-200"
                        placeholder="e.g. PDF Files/ or Custom Folder/"
                      />
                      <Edit2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel &amp; Upload Different Files
            </button>

            <button
              onClick={handleConfirmAndOrganize}
              disabled={isOrganizing}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all cursor-pointer"
            >
              {isOrganizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    Moving Files ({organizeProgress.current}/{organizeProgress.total})...
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Organize Files</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Execution / Confirmed Success State */}
      {approvalState === 'confirmed' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Files Successfully Organized!
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              All {uploadedFiles.length} files have been safely categorized and moved into their respective destination folders.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('myfiles')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <HardDrive className="w-4 h-4" />
              <span>View in My Files</span>
            </button>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-sm transition-colors cursor-pointer"
            >
              <FolderTree className="w-4 h-4" />
              <span>Organize More Files</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
