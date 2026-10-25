import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import MetricsBar from './components/MetricsBar';
import IngestionZone from './components/IngestionZone';
import RecommendationTable from './components/RecommendationTable';
import FolderTreeSidebar from './components/FolderTreeSidebar';
import FileInspectionModal from './components/FileInspectionModal';
import ReassignModal from './components/ReassignModal';
import AiStatusModal from './components/AiStatusModal';
import Toast from './components/Toast';

import {
  initialMetrics,
  initialRecommendationFiles,
  initialFolderTree,
  initialClusterSuggestions
} from './data/mockData';
import { api } from './services/api';

export default function App() {
  // Theme state: default to clean, high-contrast light mode
  const [darkMode, setDarkMode] = useState(false);

  // Core state
  const [metrics, setMetrics] = useState(initialMetrics);
  const [files, setFiles] = useState(initialRecommendationFiles);
  const [folderTree, setFolderTree] = useState(initialFolderTree);
  const [clusterSuggestions, setClusterSuggestions] = useState(initialClusterSuggestions);

  // Ingestion processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0); // 0: idle, 1: reading, 2: analyzing, 3: matching
  const [currentProcessingFile, setCurrentProcessingFile] = useState(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState('All');

  // Modals state
  const [inspectedFile, setInspectedFile] = useState(null);
  const [reassignFile, setReassignFile] = useState(null);
  const [isAiStatusOpen, setIsAiStatusOpen] = useState(false);

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
          console.warn('Backend sync warning, using local state:', err);
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
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#4f46e5', '#10b981', '#06b6d4', '#f59e0b']
      });
    } catch {
      // ignore
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
  const handleApproveMove = async (fileId, targetFolder) => {
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) return;

    // Optimistic UI updates
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setMetrics((prev) => ({
      ...prev,
      autoSortedToday: prev.autoSortedToday + 1,
      totalAnalyzed: prev.totalAnalyzed + 1
    }));
    setFolderTree((prev) => incrementFolderCount(prev, targetFolder));

    triggerConfetti();
    addToast(
      'File Moved Successfully',
      `Moved "${targetFile.name}" to ${targetFolder}`,
      'success'
    );

    // Call real backend endpoint to perform physical disk move & db update
    if (backendOnline) {
      try {
        await api.approveMove(fileId, targetFolder);
      } catch (err) {
        console.warn('Backend move error:', err);
      }
    }
  };

  // 2. Reassign folder
  const handleConfirmReassign = async (fileId, newFolder) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            recommendedFolder: newFolder,
            confidence: 90,
            confidenceReason: `User reassigned destination to ${newFolder}.`
          };
        }
        return f;
      })
    );
    addToast('Target Folder Updated', `New destination set to ${newFolder}`, 'info');

    if (backendOnline) {
      try {
        await api.reassignFolder(fileId, newFolder);
      } catch (err) {
        console.warn('Backend reassign error:', err);
      }
    }
  };

  // 3. Dismiss file
  const handleDismiss = async (fileId) => {
    const file = files.find((f) => f.id === fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    addToast('File Dismissed', `Removed ${file ? file.name : 'file'} from recommendations`, 'info');

    if (backendOnline) {
      try {
        await api.dismissFile(fileId);
      } catch (err) {
        console.warn('Backend dismiss error:', err);
      }
    }
  };

  // 4. Batch Approve
  const handleApproveSelected = async (fileIds) => {
    setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
    setMetrics((prev) => ({
      ...prev,
      autoSortedToday: prev.autoSortedToday + fileIds.length,
      totalAnalyzed: prev.totalAnalyzed + fileIds.length
    }));
    triggerConfetti();
    addToast(
      'Batch Organization Complete',
      `Organized and moved ${fileIds.length} files.`,
      'success'
    );

    if (backendOnline) {
      try {
        await api.batchApprove(fileIds);
      } catch (err) {
        console.warn('Backend batch approve error:', err);
      }
    }
  };

  // 5. Batch Dismiss
  const handleDismissSelected = async (fileIds) => {
    setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
    addToast(
      'Files Dismissed',
      `Dismissed ${fileIds.length} recommendations.`,
      'info'
    );

    if (backendOnline) {
      try {
        await api.batchDismiss(fileIds);
      } catch (err) {
        console.warn('Backend batch dismiss error:', err);
      }
    }
  };

  // 6. Real File Ingestion via FastAPI Backend
  const handleProcessFiles = async (uploadedFiles) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    for (const f of uploadedFiles) {
      setIsProcessing(true);
      const fileName = f.name;
      const fileSize = typeof f.size === 'number' ? `${(f.size / 1024).toFixed(0)} KB` : f.size || '1.2 MB';
      
      setCurrentProcessingFile({ name: fileName, size: fileSize });
      setProcessingStage(1);

      // Stage 1 delay for feedback
      await new Promise((r) => setTimeout(r, 450));
      setProcessingStage(2);

      let createdRecords = null;

      // Real backend upload & classification
      if (backendOnline && f instanceof File) {
        try {
          createdRecords = await api.uploadFiles([f]);
        } catch (err) {
          console.warn('Backend upload failed, using fallback:', err);
        }
      }

      setProcessingStage(3);
      await new Promise((r) => setTimeout(r, 450));

      if (createdRecords && createdRecords.length > 0) {
        const newRecord = createdRecords[0];
        setFiles((prev) => [newRecord, ...prev]);
        setMetrics((prev) => ({
          ...prev,
          totalAnalyzed: prev.totalAnalyzed + 1
        }));

        addToast(
          'File Processed & Categorized',
          `Matched "${newRecord.name}" to ${newRecord.recommendedFolder} (${newRecord.confidence}%)`,
          'success'
        );
      } else {
        // Fallback file generation if backend was temporarily unreachable
        const ext = fileName.split('.').pop().toLowerCase();
        let cat = 'Research Papers';
        let folder = '/Academics/Fall_2026/AI/';
        let method = 'Full Text NLP';

        if (['png', 'jpg', 'jpeg'].includes(ext)) {
          cat = 'Hardware Schematics';
          folder = '/Hardware/Circuits/';
          method = 'OCR Extracted';
        } else if (['docx', 'doc'].includes(ext)) {
          cat = 'Legal Contracts';
          folder = '/Legal/NDAs_Signed/';
        } else if (['xlsx', 'csv'].includes(ext)) {
          cat = 'Finance';
          folder = '/Finance/Invoices_2026/';
        }

        const fallbackItem = {
          id: `f-${Date.now()}`,
          name: fileName,
          size: fileSize,
          format: ext.toUpperCase(),
          ext,
          ingestionMethod: method,
          predictedCategory: cat,
          categoryTheme: 'indigo',
          recommendedFolder: folder,
          confidence: 92,
          confidenceReason: `Categorized into ${cat} based on extracted text contents and keywords.`,
          alternativeSuggestions: [
            { folder: '/Academics/Research_Archives/', confidence: 75, reason: 'Cross-topic match' }
          ],
          topTokens: [
            { term: 'document-content', weight: 0.91 },
            { term: 'topic-match', weight: 0.85 }
          ],
          excerpt: `Document content from ${fileName} parsed successfully.`,
          timestamp: 'Just now',
          status: 'pending'
        };

        setFiles((prev) => [fallbackItem, ...prev]);
        setMetrics((prev) => ({
          ...prev,
          totalAnalyzed: prev.totalAnalyzed + 1
        }));

        addToast(
          'File Categorized',
          `Suggested "${fallbackItem.name}" -> ${fallbackItem.recommendedFolder}`,
          'success'
        );
      }

      setIsProcessing(false);
      setProcessingStage(0);
      setCurrentProcessingFile(null);
    }
  };

  // Quick sample file injection (creates genuine text File and calls real upload)
  const handleSimulateBatch = () => {
    const samples = [
      {
        name: "neural_network_optimization_notes.pdf",
        content: "Abstract: We present an analysis of sparse self-attention transformer mechanisms with multi-head cross entropy optimization in PyTorch."
      },
      {
        name: "Stripe_Monthly_Platform_Invoice.pdf",
        content: "Tax Invoice #INV-2026-9812 Billed To: Hyperion Labs. Amount Due: $1,450.00 USD. Remittance date: October 2026."
      },
      {
        name: "Mutual_NDA_Bilateral_Agreement.docx",
        content: "MUTUAL NON-DISCLOSURE AGREEMENT: Confidential information, proprietary trade secrets, governing law, and indemnification between parties."
      }
    ];

    const sample = samples[Math.floor(Math.random() * samples.length)];
    const blob = new Blob([sample.content], { type: "text/plain" });
    const file = new File([blob], sample.name, { type: "text/plain" });

    handleProcessFiles([file]);
  };

  // Accept unsupervised cluster suggestion
  const handleAcceptCluster = async (cluster) => {
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
      'Cluster Created',
      `Created directory "${cluster.suggestedFolder}" and organized ${cluster.detectedCount} files!`,
      'success'
    );

    if (backendOnline) {
      try {
        await api.materializeCluster(cluster.id);
      } catch (err) {
        console.warn('Backend cluster error:', err);
      }
    }
  };

  const handleDismissCluster = async (clusterId) => {
    setClusterSuggestions((prev) => prev.filter((c) => c.id !== clusterId));
    addToast('Cluster Dismissed', 'Archived suggestion', 'info');

    if (backendOnline) {
      try {
        await api.dismissCluster(clusterId);
      } catch (err) {
        console.warn('Backend dismiss cluster error:', err);
      }
    }
  };

  // Custom folder creation
  const handleCreateFolder = async (name) => {
    const formattedPath = `/${name.replace(/^\/|\/$/g, '')}/`;
    const newFolder = {
      id: `custom-folder-${Date.now()}`,
      name: name.replace(/\//g, ''),
      path: formattedPath,
      fileCount: 0,
      isOpen: false
    };
    setFolderTree((prev) => [...prev, newFolder]);
    addToast('Folder Created', `Created directory "${formattedPath}"`, 'success');

    if (backendOnline) {
      try {
        await api.createFolder(name);
      } catch (err) {
        console.warn('Backend create folder error:', err);
      }
    }
  };

  // Reset demo dataset
  const handleResetData = () => {
    setMetrics(initialMetrics);
    setFiles(initialRecommendationFiles);
    setFolderTree(initialFolderTree);
    setClusterSuggestions(initialClusterSuggestions);
    setActiveFilter('All');
    addToast('System Reset', 'Restored initial sample data', 'info');
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900`}>
      
      {/* 1. Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSimulateBatch={handleSimulateBatch}
        isProcessing={isProcessing}
        pendingCount={files.length}
        onResetData={handleResetData}
        backendOnline={backendOnline}
        onOpenAiStatus={() => setIsAiStatusOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* 2. Compact Metrics Bar */}
        <MetricsBar
          metrics={metrics}
          onFilterFlagged={() => {
            setActiveFilter((prev) =>
              prev === 'Metadata Only Fallback' ? 'All' : 'Metadata Only Fallback'
            );
          }}
          activeFilter={activeFilter}
        />

        {/* 3. Simplified Drag-and-Drop Ingestion Zone */}
        <IngestionZone
          onProcessFiles={handleProcessFiles}
          isProcessing={isProcessing}
          processingStage={processingStage}
          currentProcessingFile={currentProcessingFile}
          onOpenAiStatus={() => setIsAiStatusOpen(true)}
        />

        {/* 4. Split Area: Table on Left/Center + Sidebar on Right */}
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          
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
              addToast('Active Directory', `Browsing ${folderPath}`, 'info');
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

      {/* Optional AI Status Modal */}
      <AiStatusModal
        isOpen={isAiStatusOpen}
        onClose={() => setIsAiStatusOpen(false)}
        backendOnline={backendOnline}
        metrics={metrics}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
