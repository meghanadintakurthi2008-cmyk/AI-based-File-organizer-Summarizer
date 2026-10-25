import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import MetricsBar from './components/MetricsBar';
import IngestionZone from './components/IngestionZone';
import RecommendationTable from './components/RecommendationTable';
import FolderTreeSidebar from './components/FolderTreeSidebar';
import FileInspectionModal from './components/FileInspectionModal';
import ReassignModal from './components/ReassignModal';
import Toast from './components/Toast';

import {
  initialMetrics,
  initialRecommendationFiles,
  initialFolderTree,
  initialClusterSuggestions,
  sampleBatchUploads
} from './data/mockData';
import { api } from './services/api';

export default function App() {
  // Theme state: dark / light
  const [darkMode, setDarkMode] = useState(true);

  // Core state
  const [metrics, setMetrics] = useState(initialMetrics);
  const [files, setFiles] = useState(initialRecommendationFiles);
  const [folderTree, setFolderTree] = useState(initialFolderTree);
  const [clusterSuggestions, setClusterSuggestions] = useState(initialClusterSuggestions);

  // Ingestion processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState({ stage: 0 }); // 0: idle, 1: Stage 1, 2: Stage 2, 3: Stage 3
  const [currentProcessingFile, setCurrentProcessingFile] = useState(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState('All');

  // Modals state
  const [inspectedFile, setInspectedFile] = useState(null);
  const [reassignFile, setReassignFile] = useState(null);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Backend live connection status
  const [backendOnline, setBackendOnline] = useState(false);

  // Sync theme with HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Check backend health & sync if active
  useEffect(() => {
    let isMounted = true;
    async function checkBackend() {
      const isAlive = await api.checkHealth();
      if (!isMounted) return;
      setBackendOnline(isAlive);
      if (isAlive) {
        try {
          const [m, recs, tree, clusters] = await Promise.all([
            api.getMetrics(),
            api.getRecommendations(),
            api.getFolderTree(),
            api.getClusterSuggestions()
          ]);
          if (m && isMounted) setMetrics(m);
          if (recs && recs.length > 0 && isMounted) setFiles(recs);
          if (tree && tree.length > 0 && isMounted) setFolderTree(tree);
          if (clusters && clusters.length > 0 && isMounted) setClusterSuggestions(clusters);
        } catch (err) {
          console.warn('Backend sync failed, using mock data:', err);
        }
      }
    }
    checkBackend();
    return () => { isMounted = false; };
  }, []);

  // Toast Helper
  const addToast = (title, message = '', type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Confetti trigger
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#ec4899']
      });
    } catch {
      // ignore in headless environments
    }
  };

  // Helper to increment folder count in directory tree recursively
  const incrementFolderCount = (tree, targetPath) => {
    return tree.map((node) => {
      let isTarget = node.path === targetPath;
      let newCount = node.fileCount;
      if (isTarget) {
        newCount += 1;
      }
      let newChildren = node.children;
      if (node.children) {
        newChildren = incrementFolderCount(node.children, targetPath);
        // If child was target or parent contains target path
        if (targetPath.startsWith(node.path)) {
          newCount += 1;
        }
      }
      return {
        ...node,
        fileCount: newCount,
        children: newChildren
      };
    });
  };

  // 1. Approve & Move single file
  const handleApproveMove = (fileId, targetFolder) => {
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) return;

    // Optimistically update file status or remove from pending
    setFiles((prev) => prev.filter((f) => f.id !== fileId));

    // Update metrics
    setMetrics((prev) => ({
      ...prev,
      autoSortedToday: prev.autoSortedToday + 1,
      totalAnalyzed: prev.totalAnalyzed + 1
    }));

    // Update tree
    setFolderTree((prev) => incrementFolderCount(prev, targetFolder));

    triggerConfetti();
    addToast(
      'File Approved & Moved',
      `Transferred "${targetFile.name}" to ${targetFolder}`,
      'success'
    );
  };

  // 2. Reassign folder
  const handleConfirmReassign = (fileId, newFolder) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            recommendedFolder: newFolder,
            confidence: 90,
            confidenceReason: `User reassigned destination to ${newFolder}. K-means cluster weights adapted.`
          };
        }
        return f;
      })
    );
    addToast('Target Reassigned', `Target path set to ${newFolder}`, 'info');
  };

  // 3. Dismiss file
  const handleDismiss = (fileId) => {
    const file = files.find((f) => f.id === fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    addToast('Recommendation Dismissed', `Ignored ${file ? file.name : 'file'}`, 'info');
  };

  // 4. Batch Approve
  const handleApproveSelected = (fileIds) => {
    setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
    setMetrics((prev) => ({
      ...prev,
      autoSortedToday: prev.autoSortedToday + fileIds.length,
      totalAnalyzed: prev.totalAnalyzed + fileIds.length
    }));
    triggerConfetti();
    addToast(
      'Batch Approval Complete',
      `Successfully routed and organized ${fileIds.length} files.`,
      'success'
    );
  };

  // 5. Batch Dismiss
  const handleDismissSelected = (fileIds) => {
    setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
    addToast(
      'Batch Dismissed',
      `Dismissed ${fileIds.length} file recommendations.`,
      'info'
    );
  };

  // 6. Ingestion Process Simulation (Extracting -> TF-IDF -> Centroid Matching)
  const processSingleFilePipeline = (fileMeta) => {
    return new Promise((resolve) => {
      setIsProcessing(true);
      setCurrentProcessingFile(fileMeta);

      // Stage 1: Extracting Text
      setProcessingState({ stage: 1 });

      setTimeout(() => {
        // Stage 2: Running TF-IDF & Classification
        setProcessingState({ stage: 2 });

        setTimeout(() => {
          // Stage 3: Matching Cluster Centroids
          setProcessingState({ stage: 3 });

          setTimeout(() => {
            // Pipeline Complete: Create new recommended file
            const ext = fileMeta.name.split('.').pop().toLowerCase();
            let format = 'PDF';
            let cat = 'Research Papers';
            let folder = '/Academics/Fall_2026/AI/';
            let method = 'Full Text NLP';

            if (['png', 'jpg', 'jpeg'].includes(ext)) {
              format = 'IMG';
              cat = 'Hardware Schematics';
              folder = '/Hardware/Circuits/';
              method = 'OCR Extracted';
            } else if (['docx', 'doc'].includes(ext)) {
              format = 'DOCX';
              cat = 'Legal Contracts';
              folder = '/Legal/NDAs_Signed/';
              method = 'Full Text NLP';
            } else if (['xlsx', 'csv'].includes(ext)) {
              format = 'SHEET';
              cat = 'Finance';
              folder = '/Finance/Invoices_2026/';
              method = 'Full Text NLP';
            }

            const newFile = {
              id: `f-${Date.now()}`,
              name: fileMeta.name,
              size: fileMeta.size || '1.8 MB',
              format,
              ext,
              ingestionMethod: method,
              predictedCategory: cat,
              categoryTheme: 'indigo',
              recommendedFolder: folder,
              confidence: 93,
              confidenceReason: `Ingested via 3-stage AI pipeline. High Cosine similarity to ${cat} cluster centroid.`,
              alternativeSuggestions: [
                { folder: '/Academics/Research_Archives/', confidence: 75, reason: 'Semantic cross-topic overlap' },
                { folder: '/Unorganized_Inbox/', confidence: 42, reason: 'Fallback buffer directory' }
              ],
              topTokens: [
                { term: 'feature-vector', weight: 0.92 },
                { term: 'centroid-match', weight: 0.87 },
                { term: 'document-stream', weight: 0.81 }
              ],
              excerpt: `Parsed content stream: Ingestion of ${fileMeta.name} finished successfully with high token density.`,
              timestamp: 'Just now',
              status: 'pending'
            };

            setFiles((prev) => [newFile, ...prev]);
            setMetrics((prev) => ({
              ...prev,
              totalAnalyzed: prev.totalAnalyzed + 1
            }));

            setProcessingState({ stage: 0 });
            setCurrentProcessingFile(null);
            setIsProcessing(false);

            addToast(
              'File Ingestion Complete',
              `Categorized "${newFile.name}" -> ${newFile.recommendedFolder} (${newFile.confidence}%)`,
              'success'
            );

            resolve();
          }, 850);
        }, 900);
      }, 850);
    });
  };

  const handleProcessFiles = async (uploadedFiles) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    for (const f of uploadedFiles) {
      await processSingleFilePipeline({
        name: f.name,
        size: typeof f.size === 'number' ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : f.size || '1.5 MB'
      });
    }
  };

  // Quick batch simulation button
  const handleSimulateBatch = () => {
    const randomSample = sampleBatchUploads[Math.floor(Math.random() * sampleBatchUploads.length)];
    handleProcessFiles([randomSample]);
  };

  // Accept unsupervised cluster suggestion
  const handleAcceptCluster = (cluster) => {
    // Add folder to tree
    const newFolderNode = {
      id: `cluster-node-${Date.now()}`,
      name: cluster.suggestedFolder.replace(/\//g, ''),
      path: cluster.suggestedFolder,
      fileCount: cluster.detectedCount,
      isOpen: false
    };

    setFolderTree((prev) => [...prev, newFolderNode]);
    setClusterSuggestions((prev) => prev.filter((c) => c.id !== cluster.id));
    setMetrics((prev) => ({
      ...prev,
      autoSortedToday: prev.autoSortedToday + cluster.detectedCount,
      totalAnalyzed: prev.totalAnalyzed + cluster.detectedCount
    }));

    triggerConfetti();
    addToast(
      'Cluster Materialized',
      `Created directory "${cluster.suggestedFolder}" and auto-moved ${cluster.detectedCount} files!`,
      'success'
    );
  };

  const handleDismissCluster = (clusterId) => {
    setClusterSuggestions((prev) => prev.filter((c) => c.id !== clusterId));
    addToast('Cluster Dismissed', 'Archived cluster suggestion', 'info');
  };

  // Custom folder creation
  const handleCreateFolder = (name) => {
    const formattedPath = `/${name.replace(/^\/|\/$/g, '')}/`;
    const newFolder = {
      id: `custom-folder-${Date.now()}`,
      name: name.replace(/\//g, ''),
      path: formattedPath,
      fileCount: 0,
      isOpen: false
    };
    setFolderTree((prev) => [...prev, newFolder]);
    addToast('Folder Created', `Added directory "${formattedPath}" to structure`, 'success');
  };

  // Reset demo dataset
  const handleResetData = () => {
    setMetrics(initialMetrics);
    setFiles(initialRecommendationFiles);
    setFolderTree(initialFolderTree);
    setClusterSuggestions(initialClusterSuggestions);
    setActiveFilter('All');
    addToast('System Reset', 'Restored default demo datasets and initial state', 'info');
  };

  return (
    <div className={`min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col font-sans`}>
      
      {/* 1. Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSimulateBatch={handleSimulateBatch}
        isProcessing={isProcessing}
        pendingCount={files.length}
        onResetData={handleResetData}
        backendOnline={backendOnline}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 2. Metrics Bar */}
        <MetricsBar
          metrics={metrics}
          onFilterFlagged={() => {
            setActiveFilter((prev) =>
              prev === 'Metadata Only Fallback' ? 'All' : 'Metadata Only Fallback'
            );
          }}
          activeFilter={activeFilter}
          totalFilesInTable={files.length}
          pendingCount={files.length}
        />

        {/* 3. Drag-and-Drop Ingestion Zone */}
        <IngestionZone
          onProcessFiles={handleProcessFiles}
          processingState={processingState}
          currentProcessingFile={currentProcessingFile}
        />

        {/* 4. Split Area: Table on Left/Center + Sidebar on Right */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          
          {/* Main Table Column */}
          <div className="flex-1 min-w-0 w-full">
            <RecommendationTable
              files={files}
              onApproveMove={handleApproveMove}
              onReassignFolder={(file) => setReassignFile(file)}
              onDismiss={handleDismiss}
              onInspectFile={(file) => setInspectedFile(file)}
              onApproveSelected={handleApproveSelected}
              onDismissSelected={handleDismissSelected}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
            />
          </div>

          {/* Right Sidebar: Directory Structure & Cluster Suggestions */}
          <FolderTreeSidebar
            folderTree={folderTree}
            clusterSuggestions={clusterSuggestions}
            onAcceptCluster={handleAcceptCluster}
            onDismissCluster={handleDismissCluster}
            onCreateFolder={handleCreateFolder}
            onSelectFolder={(folderPath) => {
              addToast('Active Directory', `Selected ${folderPath}`, 'info');
            }}
          />

        </div>

      </main>

      {/* Modals & Drawers */}
      {inspectedFile && (
        <FileInspectionModal
          file={inspectedFile}
          onClose={() => setInspectedFile(null)}
          onApproveMove={handleApproveMove}
          onReassign={(f) => setReassignFile(f)}
        />
      )}

      {reassignFile && (
        <ReassignModal
          file={reassignFile}
          onClose={() => setReassignFile(null)}
          onConfirmReassign={handleConfirmReassign}
          existingFolders={[
            '/Academics/Fall_2026/AI/',
            '/Academics/Fall_2026/Distributed_Systems/',
            '/Academics/Fall_2026/Quantum_Computing/',
            '/Academics/Research_Archives/',
            '/Finance/Invoices_2026/',
            '/Finance/Tax_Filings/',
            '/Finance/Payroll_Summaries/',
            '/Legal/Master_Service_Agreements/',
            '/Legal/NDAs_Signed/',
            '/Engineering/Architecture_Specs/',
            '/Engineering/API_Documentation/',
            '/Hardware/Circuits/',
            '/Unorganized_Inbox/'
          ]}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
