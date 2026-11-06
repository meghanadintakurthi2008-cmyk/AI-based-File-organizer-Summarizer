import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckSquare,
  Square,
  Sparkles,
  Copy,
  Download,
  Check,
  RefreshCw,
  BookOpen,
  ListOrdered,
  FileCheck,
  GraduationCap,
  History,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function SummarizePage({ onNavigate, onShowToast, backendOnline }) {
  const [allFiles, setAllFiles] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());
  const [summaryMode, setSummaryMode] = useState('short'); // 'short' | 'detailed' | 'points' | 'exam'
  const [summaryResults, setSummaryResults] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState('select'); // 'select' | 'results'
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFiles();
    loadHistory();
  }, [backendOnline]);

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await api.getAllFiles();
      if (Array.isArray(files)) {
        setAllFiles(files);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await api.getSummaryHistory();
      if (Array.isArray(history)) {
        setSummaryHistory(history);
      }
    } catch (err) {
      console.warn('Failed to load summary history:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const records = await api.uploadFiles(files);
      if (Array.isArray(records)) {
        setAllFiles((prev) => [...records, ...prev]);
        // Automatically select uploaded summarizable files
        const newIds = new Set(selectedFileIds);
        records.forEach((r) => {
          if (r.summarizable !== false) {
            newIds.add(r.id);
          }
        });
        setSelectedFileIds(newIds);
        onShowToast('Documents Uploaded', `Uploaded ${records.length} documents`, 'success');
      }
    } catch (err) {
      onShowToast('Upload Failed', err.message || 'Error uploading documents', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isSummarizable = (file) => {
    if (file.summarizable === false) return false;
    const cat = file.predictedCategory || '';
    if (['Video Files', 'Audio Files', 'Archive Files', 'Other Files'].includes(cat)) {
      return false;
    }
    return true;
  };

  const toggleSelect = (fileId) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const summarizable = allFiles.filter(isSummarizable);
    if (selectedFileIds.size === summarizable.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(summarizable.map((f) => f.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedFileIds(new Set());
  };

  const handleGenerateSummary = async () => {
    if (selectedFileIds.size === 0) return;

    setIsSummarizing(true);
    try {
      const ids = Array.from(selectedFileIds);
      const results = await api.summarizeMultipleMode(ids, summaryMode);

      if (Array.isArray(results) && results.length > 0) {
        setSummaryResults(results);
        setActiveTab('results');
        onShowToast(
          'Summaries Generated',
          `Generated ${results.length} ${summaryMode} summary report(s)`,
          'success'
        );
        loadHistory();
      } else {
        onShowToast('Notice', 'No summaries could be generated', 'info');
      }
    } catch (err) {
      console.error('Summarize error:', err);
      onShowToast('Summarize Error', err.message || 'Error generating summaries', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Copied', 'Summary copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadTxt = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^/.]+$/, '')}_${summaryMode}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
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

  const modeOptions = [
    {
      id: 'short',
      title: 'Short Summary',
      description: 'A quick 2-3 paragraph summary of the document',
      icon: BookOpen,
      color: 'violet'
    },
    {
      id: 'detailed',
      title: 'Detailed Summary',
      description: 'A comprehensive summary with all important details',
      icon: FileCheck,
      color: 'blue'
    },
    {
      id: 'points',
      title: 'Important Points',
      description: 'Key takeaways as bullet points',
      icon: ListOrdered,
      color: 'emerald'
    },
    {
      id: 'exam',
      title: 'Exam Preparation',
      description: 'Key terms, definitions, and important facts',
      icon: GraduationCap,
      color: 'amber'
    }
  ];

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              AI Summarizer Studio
            </p>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Summarize Documents
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('select')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'select'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Select Documents
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>Results</span>
            {summaryResults.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-violet-600 text-white text-[10px]">
                {summaryResults.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: Select Documents */}
      {activeTab === 'select' && (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-violet-500 dark:hover:border-violet-500 rounded-2xl p-6 text-center bg-white dark:bg-zinc-900 hover:bg-violet-50/20 dark:hover:bg-zinc-900/80 transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Upload new documents to summarize
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  PDF, DOCX, TXT, PPTX, XLSX, Images (.png, .jpg)
                </p>
              </div>
            </div>
            {isUploading && (
              <p className="text-xs text-violet-600 font-semibold mt-2 animate-pulse">
                Uploading and extracting documents...
              </p>
            )}
          </div>

          {/* Files List Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            {/* Table Header / Selection Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-violet-600" />
                  <span>Select All</span>
                </button>
                {selectedFileIds.size > 0 && (
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {selectedFileIds.size > 0 ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                  {selectedFileIds.size} document{selectedFileIds.size > 1 ? 's' : ''} selected
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  Select files to enable summarization
                </span>
              )}
            </div>

            {/* List */}
            {isLoadingFiles ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 animate-pulse">
                Loading available files...
              </div>
            ) : allFiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                No files found. Upload documents using the dropzone above.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 max-h-[420px] overflow-y-auto">
                {allFiles.map((file) => {
                  const supported = isSummarizable(file);
                  const isChecked = selectedFileIds.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => supported && toggleSelect(file.id)}
                      className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                        !supported
                          ? 'opacity-50 bg-slate-50/30 dark:bg-zinc-900/30 cursor-not-allowed'
                          : isChecked
                          ? 'bg-violet-50/60 dark:bg-violet-950/30 cursor-pointer'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          disabled={!supported}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (supported) toggleSelect(file.id);
                          }}
                          className="shrink-0 text-slate-400 dark:text-zinc-500 hover:text-violet-600 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-violet-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="shrink-0">
                          {getFileIcon(file.format, file.ext)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            <span>{file.size}</span>
                            <span>&bull;</span>
                            <span>{file.timestamp || 'Uploaded'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          {file.predictedCategory || file.format}
                        </span>

                        {!supported && (
                          <span className="text-[10px] font-semibold text-rose-500">
                            Not supported
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary Type Selection (Shown when files selected) */}
          {selectedFileIds.size > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-5 shadow-xs animate-in slide-in-from-top-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Choose Summary Format
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                  Select the level of detail or structure you need for your summaries.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {modeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = summaryMode === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSummaryMode(opt.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/30 ring-2 ring-violet-600/20'
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {opt.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all cursor-pointer"
                >
                  {isSummarizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Document Summaries...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Summary ({selectedFileIds.size})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Results & History */}
      {activeTab === 'results' && (
        <div className="space-y-8">
          {/* Active Generation Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                Latest Generated Summaries
              </h2>

              <button
                onClick={() => setActiveTab('select')}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
              >
                + Summarize More Documents
              </button>
            </div>

            {summaryResults.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  No active summary results in this session. Select documents from the "Select Documents" tab and generate summaries.
                </p>
                <button
                  onClick={() => setActiveTab('select')}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors cursor-pointer"
                >
                  Go to Select Documents
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {summaryResults.map((item, index) => (
                  <div
                    key={item.fileId || index}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.filename}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            <span className="uppercase font-semibold text-violet-600 dark:text-violet-400">
                              {item.mode} summary
                            </span>
                            <span>&bull;</span>
                            <span>{item.wordCount || 0} words</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(item.summary, item.fileId || index)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                        >
                          {copiedId === (item.fileId || index) ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDownloadTxt(item.filename, item.summary)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download TXT</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed bg-slate-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                      {item.summary || 'No summary text available.'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Previous Summaries History */}
          {summaryHistory.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Previous Summaries History
              </h3>

              <div className="space-y-3">
                {summaryHistory.map((hist) => (
                  <div
                    key={hist.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                          {hist.title || hist.filename}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {hist.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-3">
                      {hist.overview || hist.detailedSummary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
