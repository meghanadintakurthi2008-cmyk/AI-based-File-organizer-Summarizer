import React, { useState, useEffect } from 'react';
import {
  Clock,
  Trash2,
  Search,
  UploadCloud,
  FolderTree,
  FileText,
  FolderPlus,
  Edit3,
  Move,
  Download,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Folder,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ActivityPage({ onNavigate, onShowToast }) {
  const [activities, setActivities] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [limit, setLimit] = useState(50);
  const [hasMore, setHasMore] = useState(false);

  const filterTypes = [
    'all',
    'upload',
    'organize',
    'summarize',
    'folder_create',
    'file_rename',
    'file_move',
    'file_delete',
    'file_download'
  ];

  const filterLabels = {
    all: 'All Activities',
    upload: 'File Uploaded',
    organize: 'File Organized',
    summarize: 'Summarized',
    folder_create: 'Folder Created',
    file_rename: 'File Renamed',
    file_move: 'File Moved',
    file_delete: 'File Deleted',
    file_download: 'Downloaded'
  };

  useEffect(() => {
    loadActivities();
  }, [filterType, limit]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const params = {
        limit,
        offset: 0
      };
      if (filterType !== 'all') {
        params.type = filterType;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.getActivityHistory(params);
      if (Array.isArray(res)) {
        setActivities(res);
        setHasMore(res.length >= limit);
      }
    } catch (err) {
      console.error('Failed to load activity history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadActivities();
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await api.clearActivityHistory();
      setActivities([]);
      setConfirmClear(false);
      onShowToast('Activity Cleared', 'Successfully cleared activity log history', 'success');
    } catch (err) {
      onShowToast('Clear Error', err.message || 'Could not clear history', 'error');
    } finally {
      setIsClearing(false);
    }
  };

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

  const filteredList = activities.filter((act) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (act.description || '').toLowerCase().includes(q) ||
      (act.fileName || '').toLowerCase().includes(q) ||
      (act.folderTo || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Audit &amp; System Logs
            </p>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Activity History
          </h1>
        </div>

        {activities.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Filter Bar & Search */}
      <div className="space-y-3">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity by file or description..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-hidden focus:border-indigo-500 text-slate-800 dark:text-zinc-200 shadow-xs"
          />
        </form>

        {/* Filter type buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {filterTypes.map((type) => {
            const isSelected = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                {filterLabels[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activities Timeline / Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-zinc-500 animate-pulse">
            Loading activity history...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              No activity recorded yet.
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Start uploading and organizing files!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {filteredList.map((act) => {
              const isSuccess = act.status === 'success' || !act.status;

              return (
                <div
                  key={act.id || act.createdAt}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 shrink-0 mt-0.5">
                      {getActivityIcon(act.activityType)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          {filterLabels[act.activityType] || act.activityType}
                        </span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {act.description}
                        </p>
                      </div>

                      {/* File Name & Folder detail */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 flex-wrap">
                        {act.fileName && (
                          <span className="font-medium text-slate-700 dark:text-zinc-300">
                            File: {act.fileName}
                          </span>
                        )}

                        {act.folderTo && (
                          <div className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <Folder className="w-3 h-3" />
                            <span>{act.folderTo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Timestamp */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        isSuccess
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{isSuccess ? 'Success' : 'Failed'}</span>
                    </span>

                    <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                      {act.createdAt || act.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={() => setLimit((prev) => prev + 50)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Load More Activities
          </button>
        </div>
      )}

      {/* CLEAR ALL CONFIRMATION MODAL */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clear Activity History?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              This will clear all recorded activity logs. This action cannot be reversed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Clear All History</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
