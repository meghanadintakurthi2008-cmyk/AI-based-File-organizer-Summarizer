import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  BookOpen, 
  Calendar, 
  Hash, 
  HelpCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Presentation,
  History,
  FileCode,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function SummarizeWorkspace({ onUploadFiles, existingFiles = [] }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [summarizeScope, setSummarizeScope] = useState('single'); // 'single' or 'multiple'
  const [activeTab, setActiveTab] = useState('combined'); // 'combined' or fileId
  const [activeSection, setActiveSection] = useState('all'); // 'all', 'overview', 'points', 'terms', 'facts'
  
  // Results states
  const [individualSummaries, setIndividualSummaries] = useState({});
  const [combinedSummary, setCombinedSummary] = useState(null);
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  // Load previous summaries on mount
  useEffect(() => {
    api.getSummaryHistory()
      .then((hist) => {
        if (hist) setSummaryHistory(hist);
      })
      .catch((err) => console.warn('History load error:', err));
  }, []);

  // Sync existing files if available
  useEffect(() => {
    if (existingFiles.length > 0 && uploadedFiles.length === 0) {
      setUploadedFiles(existingFiles);
      setSelectedFileId(existingFiles[0].id);
    }
  }, [existingFiles]);

  const handleFileInput = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;
    await processUploadedFiles(fileList);
  };

  const processUploadedFiles = async (fileList) => {
    setErrorNotice(null);
    setIsSummarizing(true);
    setLoadingStatus(`Uploading ${fileList.length} file${fileList.length > 1 ? 's' : ''} to backend...`);
    try {
      const records = await api.uploadFiles(fileList);
      setUploadedFiles((prev) => {
        const existingIds = new Set(prev.map((f) => f.id));
        const combined = [...prev, ...records.filter((r) => !existingIds.has(r.id))];
        return combined;
      });

      // Auto-summarize immediately upon upload
      if (records.length === 1) {
        const targetId = records[0].id;
        setSelectedFileId(targetId);
        setLoadingStatus(`Extracting document text and generating 8-part summary for ${records[0].name || records[0].filename}...`);
        const res = await api.getStructuredSummary(targetId);
        setIndividualSummaries((prev) => ({
          ...prev,
          [targetId]: res
        }));
        setActiveTab(targetId);
      } else if (records.length > 1) {
        const fileIds = records.map((r) => r.id);
        setSelectedFileId(fileIds[0]);
        setLoadingStatus(`Extracting content and synthesizing multi-document analysis for ${records.length} files...`);
        const res = await api.getCombinedSummary(fileIds);
        const indivMap = {};
        (res.individualSummaries || []).forEach((item) => {
          if (item.fileId) indivMap[item.fileId] = item;
        });
        setIndividualSummaries((prev) => ({ ...prev, ...indivMap }));
        setCombinedSummary(res);
        setActiveTab('combined');
      }
      refreshHistory();
    } catch (err) {
      console.error('Summarization pipeline error:', err);
      setErrorNotice(err.message || 'File upload or summarization failed. Ensure backend server is running.');
    } finally {
      setIsSummarizing(false);
      setLoadingStatus('');
    }
  };

  // Summarize one single file
  const handleSummarizeSingle = async (fileId) => {
    if (!fileId) return;
    setErrorNotice(null);
    setIsSummarizing(true);
    setLoadingStatus('Extracting content and generating 8-part structured summary...');
    try {
      const res = await api.getStructuredSummary(fileId);
      setIndividualSummaries((prev) => ({
        ...prev,
        [fileId]: res
      }));
      setActiveTab(fileId);
      refreshHistory();
    } catch (err) {
      setErrorNotice(err.message || 'Failed to summarize document.');
    } finally {
      setIsSummarizing(false);
      setLoadingStatus('');
    }
  };

  // Summarize all uploaded files + combined synthesis
  const handleSummarizeAll = async () => {
    if (uploadedFiles.length === 0) return;
    setErrorNotice(null);
    setIsSummarizing(true);
    setLoadingStatus(`Synthesizing cross-document analysis across ${uploadedFiles.length} files...`);
    try {
      const fileIds = uploadedFiles.map((f) => f.id);
      const res = await api.getCombinedSummary(fileIds);
      
      // Map individual summaries
      const indivMap = {};
      (res.individualSummaries || []).forEach((item) => {
        if (item.fileId) indivMap[item.fileId] = item;
      });
      setIndividualSummaries((prev) => ({ ...prev, ...indivMap }));
      setCombinedSummary(res);
      setActiveTab('combined');
      refreshHistory();
    } catch (err) {
      setErrorNotice(err.message || 'Failed to synthesize combined summary.');
    } finally {
      setIsSummarizing(false);
      setLoadingStatus('');
    }
  };

  const refreshHistory = () => {
    api.getSummaryHistory().then((h) => h && setSummaryHistory(h)).catch(() => {});
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadMarkdown = (summaryObj, isCombined = false) => {
    let mdContent = '';
    if (isCombined) {
      mdContent = `# ${summaryObj.combinedSummary ? 'Cross-Document Multi-File Synthesis' : 'Document Summary'}\n\n`;
      mdContent += `## Executive Summary\n${summaryObj.combinedSummary}\n\n`;
      mdContent += `## Common Topics\n${(summaryObj.commonTopics || []).map((t) => `- ${t}`).join('\n')}\n\n`;
      mdContent += `## Key Differences\n${(summaryObj.keyDifferences || []).map((d) => `- ${d}`).join('\n')}\n\n`;
      mdContent += `## Key Findings\n${(summaryObj.keyFindings || []).map((f) => `- ${f}`).join('\n')}\n\n`;
    } else {
      mdContent = `# ${summaryObj.title || summaryObj.filename}\n\n`;
      mdContent += `**Category:** ${summaryObj.fileType} | **Main Topic:** ${summaryObj.mainTopic} | **Word Count:** ${summaryObj.wordCount}\n\n`;
      mdContent += `## 1. Short Overview\n${summaryObj.overview}\n\n`;
      mdContent += `## 2. Detailed Summary\n${summaryObj.detailedSummary}\n\n`;
      mdContent += `## 3. Important Points\n${(summaryObj.importantPoints || []).map((p) => `- ${p}`).join('\n')}\n\n`;
      mdContent += `## 4. Key Terms & Definitions\n${(summaryObj.keyTerms || []).map((k) => `- **${k.term}:** ${k.definition}`).join('\n')}\n\n`;
      mdContent += `## 5. Important Dates, Figures & Facts\n${(summaryObj.datesFiguresFacts || []).map((f) => `- [${f.category.toUpperCase()}] **${f.item}**: ${f.context}`).join('\n')}\n\n`;
      mdContent += `## 6. Conclusion\n${summaryObj.conclusion}\n\n`;
    }

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isCombined ? 'SmartFolder_Combined_Synthesis.md' : `${summaryObj.filename || 'Summary'}.md`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getFormatIcon = (format = '') => {
    const f = format.toLowerCase();
    if (f.includes('pdf')) return <span className="font-mono font-bold text-[9px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">PDF</span>;
    if (f.includes('doc')) return <span className="font-mono font-bold text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">DOC</span>;
    if (f.includes('xls') || f.includes('csv')) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (f.includes('ppt')) return <Presentation className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-indigo-500" />;
  };

  const currentSummary = activeTab !== 'combined' ? individualSummaries[activeTab] : null;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Choice: Single Document vs Multiple Documents */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span>How would you like to summarize your documents?</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Select whether you want to analyze a single file or multiple files together.
            </p>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSummarizeSingle(selectedFileId)}
                disabled={isSummarizing || !selectedFileId}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Re-Summarize Selected
              </button>

              <button
                onClick={handleSummarizeAll}
                disabled={isSummarizing || uploadedFiles.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-xs shadow-violet-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Summarize All ({uploadedFiles.length})</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Option A: Single Document */}
          <button
            type="button"
            onClick={() => {
              setSummarizeScope('single');
              if (uploadedFiles.length > 0 && selectedFileId) {
                setActiveTab(selectedFileId);
              }
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
              summarizeScope === 'single'
                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 ring-1 ring-violet-500/30 shadow-xs'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              summarizeScope === 'single'
                ? 'bg-violet-600 text-white shadow-xs shadow-violet-600/30'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Summarize One File
                </span>
                {summarizeScope === 'single' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Upload 1 file for an in-depth 8-part structured breakdown (Overview, Points, Terms, Dates & Facts).
              </p>
            </div>
          </button>

          {/* Option B: Multiple Documents */}
          <button
            type="button"
            onClick={() => {
              setSummarizeScope('multiple');
              if (combinedSummary) {
                setActiveTab('combined');
              }
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
              summarizeScope === 'multiple'
                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 ring-1 ring-violet-500/30 shadow-xs'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              summarizeScope === 'multiple'
                ? 'bg-violet-600 text-white shadow-xs shadow-violet-600/30'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Summarize Multiple Files
                </span>
                {summarizeScope === 'multiple' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Upload 2+ files for individual breakdowns plus a combined synthesis (Common Topics & Key Findings).
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorNotice && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>{errorNotice}</p>
        </div>
      )}

      {/* Main Studio Layout: Upload & File Queue on Left, Rich Summary View on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Upload Dropzone & File Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Compact Upload Dropzone */}
          <div className="rounded-2xl border-2 border-dashed border-violet-200 dark:border-violet-900/60 bg-white/70 dark:bg-zinc-900/70 p-5 text-center hover:border-violet-400 dark:hover:border-violet-700 transition-colors">
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                multiple={summarizeScope === 'multiple'}
                onChange={handleFileInput}
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.pptx,.md"
              />
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2 shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {summarizeScope === 'single'
                  ? 'Click or Drag 1 Document Here'
                  : 'Click or Drag Multiple Documents Here'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                {summarizeScope === 'single'
                  ? 'PDF, DOCX, TXT, CSV, PPTX (1 file)'
                  : 'PDF, DOCX, TXT, CSV, PPTX (batch)'}
              </p>
            </label>
          </div>

          {/* Uploaded Files Queue */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 text-xs">
              <span className="font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider text-[11px]">
                Uploaded Queue ({uploadedFiles.length})
              </span>
              <span className="text-[10px] text-slate-400">
                Select to inspect
              </span>
            </div>

            <div className="mt-3 space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {uploadedFiles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  <FileText className="w-8 h-8 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p>No documents queued yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upload documents above to summarize.</p>
                </div>
              ) : (
                uploadedFiles.map((file) => {
                  const isSelected = selectedFileId === file.id;
                  const hasSummary = Boolean(individualSummaries[file.id]);

                  return (
                    <div
                      key={file.id}
                      onClick={() => {
                        setSelectedFileId(file.id);
                        if (hasSummary) {
                          setActiveTab(file.id);
                        } else {
                          handleSummarizeSingle(file.id);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'border-violet-500/80 bg-violet-50/60 dark:bg-violet-950/30'
                          : 'border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFormatIcon(file.format || file.ext)}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-zinc-200 truncate text-xs">
                            {file.name || file.filename}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {file.size}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasSummary ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Summarized
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFileId(file.id);
                              handleSummarizeSingle(file.id);
                            }}
                            className="p-1 rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50"
                            title="Summarize this file"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Previous Summaries History */}
          {summaryHistory.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <History className="w-3.5 h-3.5 text-indigo-500" />
                <span>Previous Summaries History</span>
              </div>
              <div className="mt-2.5 space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {summaryHistory.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.isCombined) {
                        setCombinedSummary(item);
                        setActiveTab('combined');
                      } else {
                        setIndividualSummaries((prev) => ({ ...prev, [item.id]: item }));
                        setActiveTab(item.id);
                      }
                    }}
                    className="p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer text-xs transition-colors"
                  >
                    <p className="font-semibold text-slate-800 dark:text-zinc-200 truncate text-[11px]">
                      {item.title || item.filename}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>{item.mainTopic || 'Document'}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Active Summary Display (8 cols) */}
        <div className="lg:col-span-8">
          
          {/* Summary Tab Bar (Combined vs Individual File Tabs) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-zinc-800 mb-4">
            {combinedSummary && (
              <button
                onClick={() => setActiveTab('combined')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'combined'
                    ? 'bg-violet-600 text-white shadow-xs shadow-violet-600/20'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Combined Synthesis</span>
              </button>
            )}

            {uploadedFiles.map((f) => {
              const hasSum = Boolean(individualSummaries[f.id]);
              if (!hasSum) return null;

              return (
                <button
                  key={f.id}
                  onClick={() => setActiveTab(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all truncate max-w-[200px] cursor-pointer ${
                    activeTab === f.id
                      ? 'bg-violet-600 text-white shadow-xs shadow-violet-600/20'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{f.name || f.filename}</span>
                </button>
              );
            })}
          </div>

          {/* Loading Animation during AI analysis */}
          {isSummarizing && (
            <div className="py-20 text-center rounded-2xl border border-violet-200/80 dark:border-violet-900/60 bg-white dark:bg-zinc-900 p-8 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-600 flex items-center justify-center mx-auto mb-3 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
                {loadingStatus || 'Extracting Document Context & Computing Summaries...'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Running TextRank sentence scoring, key concept identification, and factual entity extraction.
              </p>
            </div>
          )}

          {/* View 1: Cross-Document Combined Synthesis View */}
          {!isSummarizing && activeTab === 'combined' && combinedSummary && (
            <div className="rounded-3xl border border-violet-200/80 dark:border-violet-900/60 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in">
              
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-zinc-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      Multi-Document Synthesis
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {combinedSummary.fileCount || uploadedFiles.length} files analyzed
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-1">
                    Integrated Cross-Document Analysis
                  </h3>
                </div>

                {/* Actions: Copy & Download */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(combinedSummary.combinedSummary, 'combined')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {copiedId === 'combined' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'combined' ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadMarkdown(combinedSummary, true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.md)</span>
                  </button>
                </div>
              </div>

              {/* 1. Combined Narrative Brief */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-500" />
                  <span>Executive Combined Summary</span>
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {combinedSummary.combinedSummary}
                </div>
              </div>

              {/* 2. Common Topics Across Documents */}
              {combinedSummary.commonTopics && combinedSummary.commonTopics.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Common Topics Across Files</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {combinedSummary.commonTopics.map((top, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Important Differences & Document Contrast */}
              {combinedSummary.keyDifferences && combinedSummary.keyDifferences.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <span>Important Differences & Specializations</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {combinedSummary.keyDifferences.map((diff, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-xs text-slate-700 dark:text-zinc-300">
                        {diff}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Unified Key Findings */}
              {combinedSummary.keyFindings && combinedSummary.keyFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />
                    <span>Key Findings</span>
                  </h4>
                  <ul className="space-y-2">
                    {combinedSummary.keyFindings.map((find, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-zinc-300 bg-violet-50/30 dark:bg-violet-950/20 p-2.5 rounded-xl border border-violet-100 dark:border-violet-950">
                        <span className="w-5 h-5 rounded-lg bg-violet-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{find}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          {/* View 2: 8-Part Structured Single Document Summary View */}
          {!isSummarizing && currentSummary && (
            <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in">
              
              {/* Document Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {currentSummary.fileType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {currentSummary.wordCount ? `${currentSummary.wordCount.toLocaleString()} words` : ''}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-1">
                    {currentSummary.title || currentSummary.filename}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(currentSummary.detailedSummary, currentSummary.filename)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {copiedId === currentSummary.filename ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === currentSummary.filename ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadMarkdown(currentSummary, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.md)</span>
                  </button>
                </div>
              </div>

              {/* 8-Part Structured Components */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Main Topic */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Main Subject & Topic</span>
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                    {currentSummary.mainTopic}
                  </p>
                </div>

                {/* 2. Short Overview */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-950/40 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-violet-500" />
                    <span>Short Executive Overview</span>
                  </span>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 mt-1 leading-relaxed">
                    {currentSummary.overview}
                  </p>
                </div>

              </div>

              {/* 3. Detailed Summary */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-500" />
                  <span>Detailed Extractive Summary</span>
                </span>
                <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {currentSummary.detailedSummary}
                </div>
              </div>

              {/* 4. Important Points (Key Takeaways) */}
              {currentSummary.importantPoints && currentSummary.importantPoints.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Important Points</span>
                  </span>
                  <div className="space-y-1.5">
                    {currentSummary.importantPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Key Terms & Definitions */}
              {currentSummary.keyTerms && currentSummary.keyTerms.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span>Key Terms & Definitions</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentSummary.keyTerms.map((term, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-blue-100 dark:border-blue-950 bg-blue-50/30 dark:bg-blue-950/20">
                        <p className="font-bold text-xs text-blue-900 dark:text-blue-300">
                          {term.term}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                          {term.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Important Dates, Figures, and Facts */}
              {currentSummary.datesFiguresFacts && currentSummary.datesFiguresFacts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Important Dates, Figures, and Facts</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {currentSummary.datesFiguresFacts.map((fact, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
                        <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 block truncate">
                          {fact.item}
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                          {fact.context}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Conclusion */}
              {currentSummary.conclusion && (
                <div className="p-4 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-950 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Conclusion & Final Takeaway
                  </span>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {currentSummary.conclusion}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Empty state when no summary is selected */}
          {!isSummarizing && !currentSummary && !combinedSummary && (
            <div className="py-24 text-center rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8">
              <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
                Ready for AI Summarization
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-5">
                Upload one or multiple documents on the left. Click "Summarize Selected" or "Summarize All Files" to generate authentic structured insights.
              </p>
              {uploadedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleSummarizeAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Summarizing ({uploadedFiles.length} files)</span>
                </button>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
