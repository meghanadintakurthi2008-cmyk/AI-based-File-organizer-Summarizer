import React from 'react';
import { 
  Folder, 
  FolderOpen, 
  FolderPlus, 
  Edit3, 
  Trash2, 
  FolderKanban,
  HardDrive,
  Eye,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Code,
  Film,
  Music,
  Archive,
  FileText
} from 'lucide-react';

export default function FolderTreeSidebar({
  folderTree = [],
  files = [],
  onOpenCreateFolder,
  onViewFolder,
  onOpenRenameFolder,
  onOpenDeleteFolder,
  onSelectFolder
}) {
  // Separate default system categories and user-created custom folders
  const customFolders = folderTree.filter((f) => f.isCustom);
  const defaultFolders = folderTree.filter((f) => !f.isCustom);

  // Use uploaded-file records as the single source of truth
  const getCategoryCount = (catName, catPath, backendCount) => {
    const matching = files.filter(
      (f) => (f.predictedCategory === catName || f.recommendedFolder === catPath) && f.status !== 'dismissed'
    );
    // Combine local active files with backend count if larger
    return Math.max(backendCount || 0, matching.length);
  };

  const getCustomFolderCount = (fPath, backendCount) => {
    const matching = files.filter(
      (f) => f.recommendedFolder === fPath && f.status !== 'dismissed'
    );
    return Math.max(backendCount || 0, matching.length);
  };

  // Total files across active records
  const activeFilesCount = files.filter((f) => f.status !== 'dismissed').length;
  const backendTotal = folderTree.reduce((acc, f) => acc + (f.fileCount || 0), 0);
  const totalOrganized = Math.max(activeFilesCount, backendTotal);

  const getCategoryIcon = (name) => {
    switch (name) {
      case 'PDF Files':
        return <span className="font-mono font-bold text-[9px] text-rose-500 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20">PDF</span>;
      case 'Word Files':
        return <span className="font-mono font-bold text-[9px] text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20">DOC</span>;
      case 'Excel Files':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />;
      case 'PowerPoint Files':
        return <Presentation className="w-3.5 h-3.5 text-amber-500" />;
      case 'Image Files':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-500" />;
      case 'Code Files':
        return <Code className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Video Files':
        return <Film className="w-3.5 h-3.5 text-red-500" />;
      case 'Audio Files':
        return <Music className="w-3.5 h-3.5 text-teal-500" />;
      case 'Archive Files':
        return <Archive className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <aside className="w-full xl:w-80 flex flex-col gap-5 shrink-0">
      
      {/* Section 1: My Folders (User-Created Custom Folders) */}
      <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-white dark:bg-zinc-900/90 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-950/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                My Folders
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                User-Created Destinations
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              {customFolders.length}
            </span>
            <button
              onClick={onOpenCreateFolder}
              className="p-1 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
              title="Create New Custom Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Folder List */}
        <div className="mt-3 space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
          {customFolders.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-2">
              <Folder className="w-8 h-8 text-slate-300 dark:text-zinc-700 stroke-[1.5]" />
              <p className="font-semibold text-slate-700 dark:text-zinc-300">
                No custom folders yet
              </p>
              <p className="text-[11px] text-slate-400 max-w-[200px]">
                Create your own folders like &quot;My College Notes&quot; or &quot;Semester 3&quot;.
              </p>
              <button
                type="button"
                onClick={onOpenCreateFolder}
                className="mt-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                + Create First Folder
              </button>
            </div>
          ) : (
            customFolders.map((folder) => {
              const count = getCustomFolderCount(folder.path, folder.fileCount);
              return (
                <div
                  key={folder.id}
                  className="group p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex items-center justify-between gap-2"
                >
                  {/* Folder Info */}
                  <button
                    type="button"
                    onClick={() => onViewFolder?.(folder)}
                    className="flex items-center gap-2 min-w-0 text-left flex-1 cursor-pointer"
                    title="Click to view files in folder"
                  >
                    <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {folder.name}
                      </p>
                      {folder.parentPath && (
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          in {folder.parentPath}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Counter & Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                      {count}
                    </span>

                    {/* View Files */}
                    <button
                      onClick={() => onViewFolder?.(folder)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="View Files"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Rename Folder */}
                    <button
                      onClick={() => onOpenRenameFolder?.(folder)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Rename Folder"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Folder */}
                    <button
                      onClick={() => onOpenDeleteFolder?.(folder)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 2: Default File-Type Categories */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Default Categories
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                Automatic File-Type Folders
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
            11 types
          </span>
        </div>

        {/* Default Categories List */}
        <div className="mt-2.5 space-y-1 max-h-[380px] overflow-y-auto pr-1">
          {defaultFolders.map((node) => {
            const count = getCategoryCount(node.name, node.path, node.fileCount);
            return (
              <div
                key={node.id}
                onClick={() => {
                  onSelectFolder?.(node.path);
                  onViewFolder?.(node);
                }}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors text-xs group"
                title="Click to view files in category"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    {getCategoryIcon(node.name)}
                  </div>
                  <span className="truncate font-medium text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {node.name}
                  </span>
                </div>

                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 group-hover:bg-slate-200 dark:group-hover:bg-zinc-700 shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tree summary footer with dynamic counts */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Total Organized Files</span>
          <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">
            {totalOrganized} file{totalOrganized === 1 ? '' : 's'}
          </span>
        </div>
      </div>

    </aside>
  );
}
