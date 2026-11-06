import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  FileText,
  HardDrive,
  Clock,
  ArrowRight,
  UploadCloud,
  FolderPlus,
  Edit3,
  Move,
  Trash2,
  Download,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardPage({ onNavigate, backendOnline }) {
  const [metrics, setMetrics] = useState({
    totalFiles: 0,
    filesAnalyzed: 0,
    recommendations: 0,
    categoriesFound: 0,
    autoSortedToday: 0
  });
  const [summaryCount, setSummaryCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [metricsRes, activitiesRes, filesRes, summariesRes] = await Promise.allSettled([
          api.getMetrics(),
          api.getRecentActivity(5),
          api.getRecommendations({ status: 'all' }),
          api.getSummaryHistory()
        ]);

        if (isMounted) {
          if (metricsRes.status === 'fulfilled' && metricsRes.value) {
            setMetrics(metricsRes.value);
          }
          if (activitiesRes.status === 'fulfilled' && Array.isArray(activitiesRes.value)) {
            setRecentActivities(activitiesRes.value);
          }
          if (filesRes.status === 'fulfilled' && Array.isArray(filesRes.value)) {
            setRecentFiles(filesRes.value.slice(0, 4));
          }
          if (summariesRes.status === 'fulfilled' && Array.isArray(summariesRes.value)) {
            setSummaryCount(summariesRes.value.length);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [backendOnline]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload':
        return <UploadCloud className="w-4 h-4 text-blue-500" />;
      case 'organize':
        return <FolderTree className="w-4 h-4 text-emerald-500" />;
      case 'summarize':
        return <FileText className="w-4 h-4 text-violet-500" />;
      case 'folder_create':
        return <FolderPlus className="w-4 h-4 text-amber-500" />;
      case 'file_rename':
        return <Edit3 className="w-4 h-4 text-slate-500" />;
      case 'file_move':
        return <Move className="w-4 h-4 text-indigo-500" />;
      case 'file_delete':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'file_download':
        return <Download className="w-4 h-4 text-teal-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getFileIcon = (category, ext = '') => {
    const extLower = (ext || '').toLowerCase();
    const cat = category || '';

    if (cat.includes('PDF') || extLower === 'pdf') {
      return <FileText className="w-4 h-4 text-rose-500" />;
    }
    if (cat.includes('Word') || ['doc', 'docx'].includes(extLower)) {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    if (cat.includes('Excel') || ['xls', 'xlsx', 'csv'].includes(extLower)) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    }
    if (cat.includes('PowerPoint') || ['ppt', 'pptx'].includes(extLower)) {
      return <FileText className="w-4 h-4 text-amber-500" />;
    }
    if (cat.includes('Image') || ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extLower)) {
      return <ImageIcon className="w-4 h-4 text-purple-500" />;
    }
    if (cat.includes('Code') || ['py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json'].includes(extLower)) {
      return <FileCode className="w-4 h-4 text-sky-500" />;
    }
    if (cat.includes('Video') || ['mp4', 'mov', 'mkv'].includes(extLower)) {
      return <Video className="w-4 h-4 text-pink-500" />;
    }
    if (cat.includes('Audio') || ['mp3', 'wav', 'flac'].includes(extLower)) {
      return <Music className="w-4 h-4 text-teal-500" />;
    }
    if (cat.includes('Archive') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(extLower)) {
      return <Archive className="w-4 h-4 text-amber-600" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const activityTodayCount = recentActivities.filter(a => {
    const t = a.timestamp || '';
    return t.includes('Just now') || t.includes('m ago') || t.includes('h ago');
  }).length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            File Organizer &amp; Summarizer
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 mt-1">
            Your Personal Intelligent File Management Assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              backendOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`}
            />
            {backendOnline ? 'AI Backend Connected' : 'AI Backend Offline'}
          </div>
        </div>
      </div>

      {/* Two Main Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 - Organize Files */}
        <div className="relative group overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Organize Files
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Organize your files intelligently using your preferred method. Choose between AI recommendations, custom folder rules, or deep content-based analysis.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('organize')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <span>Start Organizing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2 - Summarize Documents */}
        <div className="relative group overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Summarize Documents
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Select your documents and generate meaningful summaries. Extract key points, exam study guides, or concise overviews from PDFs, DOCX, and presentations.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('summarize')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-sm shadow-md shadow-violet-600/20 hover:shadow-violet-600/30 transition-all cursor-pointer"
            >
              <span>Start Summarizing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Total Files
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {metrics.totalFiles || 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Summaries Generated
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {summaryCount}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Activity Today
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {activityTodayCount}
            </p>
          </div>
        </div>
      </div>

      {/* Split Section: Recent Activity & My Files Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Recent Activity Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Recent Activity
            </h3>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-zinc-500 animate-pulse">
              Loading recent activity...
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
              No recent activity yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {recentActivities.map((act) => (
                <div key={act.id || act.createdAt} className="py-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/80">
                    {getActivityIcon(act.activityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate">
                      {act.description || act.fileName}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                      {act.timestamp || act.createdAt}
                    </p>
                  </div>
                  {act.status && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        act.status === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {act.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Files Preview Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              Recently Uploaded Files
            </h3>
            <button
              onClick={() => onNavigate('myfiles')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-zinc-500 animate-pulse">
              Loading recent files...
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
              No files uploaded yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {recentFiles.map((file) => (
                <div key={file.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/80 shrink-0">
                      {getFileIcon(file.predictedCategory, file.ext)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                        {file.size} &bull; {file.timestamp || 'Uploaded'}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                    {file.predictedCategory || file.format}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
