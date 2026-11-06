import React, { useState, useRef } from 'react';
import {
  BrainCircuit,
  UploadCloud,
  FileText,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Tag,
  ArrowLeft,
  FolderTree,
  HardDrive,
  Edit2
} from 'lucide-react';
import { api } from '../services/api';

export default function OrganizeContentPage({ onNavigate, onShowToast }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [contentSuggestions, setContentSuggestions] = useState(null); // array of suggestions from API
  const [editedGroups, setEditedGroups] = useState({}); // originalFolder -> userEditedFolder
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    // Filter to PDF, DOCX, TXT, PPTX only
    const allowed = ['pdf', 'doc', 'docx', 'txt', 'pptx', 'md'];
    const validFiles = files.filter((f) => {
      const ext = f.name.split('.').pop().toLowerCase();
      return allowed.includes(ext);
    });

    if (validFiles.length < files.length) {
      onShowToast('Notice', 'Non-document files filtered out. Content analysis requires PDF, DOCX, TXT, or PPTX.', 'info');
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      const records = await api.uploadFiles(validFiles);
      if (Array.isArray(records)) {
        setUploadedFiles((prev) => [...records, ...prev]);
        onShowToast('Documents Added', `Uploaded ${records.length} documents for content analysis`, 'success');
      }
    } catch (err) {
      onShowToast('Upload Failed', err.message || 'Error uploading documents', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeContent = async () => {
    if (uploadedFiles.length === 0) return;

    setIsAnalyzing(true);
    try {
      const fileIds = uploadedFiles.map((f) => f.id);
      const suggestions = await api.contentOrganize(fileIds);

      if (Array.isArray(suggestions) && suggestions.length > 0) {
        setContentSuggestions(suggestions);

        // Prepopulate editedGroups with default suggested folder names
        const groupMap = {};
        suggestions.forEach((s) => {
          const folder = s.suggestedFolder || 'Documents/';
          if (!groupMap[folder]) {
            groupMap[folder] = folder;
          }
        });
        setEditedGroups(groupMap);
        onShowToast('Analysis Complete', `Extracted text and clustered ${suggestions.length} documents`, 'success');
      } else {
        onShowToast('Analysis Notice', 'No topics could be extracted from these files', 'info');
      }
    } catch (err) {
      console.error('Content organize error:', err);
      onShowToast('Analysis Failed', err.message || 'Error analyzing document contents', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Group suggestions by suggestedFolder
  const groupedSuggestions = React.useMemo(() => {
    if (!contentSuggestions) return {};
    const groups = {};
    contentSuggestions.forEach((s) => {
      const folderKey = s.suggestedFolder || 'Other Documents/';
      if (!groups[folderKey]) {
        groups[folderKey] = {
          folderKey,
          files: [],
          keywords: new Set(),
          confidences: []
        };
      }
      groups[folderKey].files.push(s);
      groups[folderKey].confidences.push(s.confidence || 80);
      (s.topKeywords || []).forEach((kw) => groups[folderKey].keywords.add(kw));
    });
    return groups;
  }, [contentSuggestions]);

  const handleFolderChange = (originalFolder, newFolder) => {
    setEditedGroups((prev) => ({
      ...prev,
      [originalFolder]: newFolder
    }));
  };

  const handleExecuteOrganization = async () => {
    if (!contentSuggestions || contentSuggestions.length === 0) return;

    setIsOrganizing(true);
    let successCount = 0;

    for (const item of contentSuggestions) {
      const targetFolder = (editedGroups[item.suggestedFolder] || item.suggestedFolder).trim();
      const formattedTarget = targetFolder.endsWith('/') ? targetFolder : `${targetFolder}/`;

      try {
        await api.approveMove(item.fileId, formattedTarget);
        successCount++;
      } catch (err) {
        console.error(`Failed to move file ${item.fileName}:`, err);
      }
    }

    setIsOrganizing(false);
    setIsFinished(true);
    onShowToast('Content Organization Complete', `Organized ${successCount} documents into topic folders`, 'success');
  };

  const handleReset = () => {
    setUploadedFiles([]);
    setContentSuggestions(null);
    setEditedGroups({});
    setIsFinished(false);
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header & Breadcrumb */}
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
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Method 3
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Content-Based Organization
            </h1>
          </div>
        </div>
      </div>

      {/* Finished State */}
      {isFinished ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Topic Organization Complete!
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Documents have been deeply analyzed and arranged into topic-based folders.
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
              <BrainCircuit className="w-4 h-4" />
              <span>Analyze More Documents</span>
            </button>
          </div>
        </div>
      ) : !contentSuggestions ? (
        /* Step 1 & 2: Upload Documents & Trigger Analysis */
        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 sm:p-10 text-center bg-white dark:bg-zinc-900 hover:bg-emerald-50/20 dark:hover:bg-zinc-900/80 transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.pptx,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-3">
              Upload Documents for Content Analysis
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Supports: PDF, Word (DOC/DOCX), Text (TXT/MD), and PowerPoint (PPTX)
            </p>
            {isUploading && (
              <p className="text-xs text-emerald-600 font-semibold mt-3 animate-pulse">
                Uploading documents...
              </p>
            )}
          </div>

          {/* Uploaded Files Preview List */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Uploaded Documents ({uploadedFiles.length})
                </h3>
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Clear list
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 max-h-60 overflow-y-auto">
                {uploadedFiles.map((f) => (
                  <div key={f.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                        {f.name}
                      </span>
                    </div>
                    <span className="text-slate-400 shrink-0">{f.size}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleAnalyzeContent}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting text and analyzing topics...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-4 h-4" />
                      <span>Analyze Content &amp; Detect Topics</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Step 3 & 4: Review Groups and Confirm */
        <div className="space-y-6">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                  Topic Groups Detected
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Review the topic-based groupings and edit the target folder names as desired.
                </p>
              </div>
            </div>
            <button
              onClick={() => setContentSuggestions(null)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            >
              Re-analyze
            </button>
          </div>

          {/* Grouped Topics Cards */}
          <div className="space-y-4">
            {Object.entries(groupedSuggestions).map(([folderKey, group]) => {
              const currentFolder = editedGroups[folderKey] || folderKey;
              const avgConfidence = Math.round(
                group.confidences.reduce((a, b) => a + b, 0) / group.confidences.length
              );

              return (
                <div
                  key={folderKey}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
                        Topic Folder Name (Editable)
                      </label>
                      <div className="relative max-w-md">
                        <input
                          type="text"
                          value={currentFolder}
                          onChange={(e) => handleFolderChange(folderKey, e.target.value)}
                          className="w-full text-sm font-bold px-3 py-1.5 pr-8 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-hidden focus:border-emerald-500 text-slate-900 dark:text-white"
                        />
                        <Edit2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {group.files.length} document{group.files.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                        {avgConfidence}% Match
                      </span>
                    </div>
                  </div>

                  {/* Keywords tags */}
                  {group.keywords.size > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Extracted Keywords:
                      </span>
                      {Array.from(group.keywords).map((kw, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Documents in this group */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Documents in this Topic Group:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.files.map((file) => (
                        <div
                          key={file.fileId}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                              {file.fileName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleExecuteOrganization}
              disabled={isOrganizing}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {isOrganizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Moving Documents into Topic Folders...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Organize Into These Folders</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
