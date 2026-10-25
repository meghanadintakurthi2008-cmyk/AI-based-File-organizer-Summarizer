import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Plus, 
  Check, 
  HardDrive
} from 'lucide-react';

export default function FolderTreeSidebar({
  folderTree,
  clusterSuggestions,
  onAcceptCluster,
  onDismissCluster,
  onSelectFolder,
  onCreateFolder
}) {
  const [treeData, setTreeData] = useState(folderTree);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Toggle open/closed state of a folder node
  const toggleFolder = (nodeId) => {
    const updateTree = (nodes) => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setTreeData((prev) => updateTree(prev));
  };

  // Render recursive folder tree item
  const renderTreeItem = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isOpen = node.isOpen;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => {
            if (hasChildren) toggleFolder(node.id);
            if (onSelectFolder) onSelectFolder(node.path);
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className="group flex items-center justify-between py-1.5 pr-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren ? (
              <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            ) : (
              <span className="w-3.5 h-3.5 inline-block" />
            )}

            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500/80 shrink-0" />
            )}

            <span className="truncate font-mono text-zinc-700 dark:text-zinc-300 font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
              {node.name}
            </span>
          </div>

          <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700">
            {node.fileCount}
          </span>
        </div>

        {hasChildren && isOpen && (
          <div className="border-l border-zinc-200 dark:border-zinc-800/80 ml-4">
            {node.children.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleCreateNewFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder?.(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  return (
    <aside className="w-full xl:w-80 flex flex-col gap-5 shrink-0">
      
      {/* Widget 1: Unsupervised Cluster Suggestions */}
      <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-zinc-900/80 dark:to-zinc-900/80 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                Cluster Suggestions
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Unsupervised K-Means Pattern Discovery
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
            {clusterSuggestions.length} new
          </span>
        </div>

        <div className="space-y-3">
          {clusterSuggestions.length === 0 ? (
            <div className="py-6 text-center text-zinc-400 text-xs">
              No new unorganized clusters detected
            </div>
          ) : (
            clusterSuggestions.map((cluster) => (
              <div
                key={cluster.id}
                className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-xs hover:border-indigo-400/50 transition-all"
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {cluster.topicName}
                    </span>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Found <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{cluster.detectedCount} files</strong> matching topic
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {cluster.confidence}% fit
                  </span>
                </div>

                {/* Target Path Suggestion */}
                <div className="mt-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                  <span className="truncate">Suggest: {cluster.suggestedFolder}</span>
                </div>

                {/* Keywords Pill tags */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {cluster.topKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onAcceptCluster(cluster)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Create & Move All</span>
                  </button>
                  <button
                    onClick={() => onDismissCluster(cluster.id)}
                    className="py-1.5 px-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Widget 2: Existing Directory Structure Tree */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Directory Structure
            </h3>
          </div>
          <button
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="p-1 rounded text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Create Custom Folder"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Add Folder Form */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateNewFolder} className="mb-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 animate-in fade-in">
            <input
              type="text"
              placeholder="/New_Directory_Name/"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 bg-transparent text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-1 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-500"
            >
              Add
            </button>
          </form>
        )}

        {/* Recursive Folder Tree */}
        <div className="space-y-0.5 max-h-[460px] overflow-y-auto pr-1">
          {treeData.map((node) => renderTreeItem(node))}
        </div>

        {/* Tree summary footer */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Active Mounted Volume</span>
          <span className="font-mono text-zinc-600 dark:text-zinc-300">1,248 total files</span>
        </div>
      </div>

    </aside>
  );
}
