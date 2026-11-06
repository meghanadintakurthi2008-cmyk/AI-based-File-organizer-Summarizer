// Use relative path by default to leverage Vite reverse proxy, fallback to direct port 8000
const PRIMARY_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const DIRECT_BACKEND = 'http://127.0.0.1:8000/api/v1';
const LOCALHOST_BACKEND = 'http://localhost:8000/api/v1';

async function requestApi(endpoint, options = {}) {
  const urlsToTry = [
    `${PRIMARY_BASE}${endpoint}`,
    `${DIRECT_BACKEND}${endpoint}`,
    `${LOCALHOST_BACKEND}${endpoint}`
  ];

  let lastError = null;

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      // If the server actually responded with a 4xx or 5xx error, do not retry other URLs; throw the real error
      if (err.message && (err.message.includes('Server returned HTTP') || !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError'))) {
        throw err;
      }
      // If it's a network error (like Failed to fetch), try the next URL in list
    }
  }

  // If all URLs failed to connect (e.g. backend server process is stopped)
  throw lastError || new Error('Backend server is offline or unreachable at http://127.0.0.1:8000. Please start the backend server using: python backend/run.py');
}

export const api = {
  // Check backend health
  async checkHealth() {
    const healthUrls = ['/health', 'http://127.0.0.1:8000/health', 'http://localhost:8000/health'];
    for (const url of healthUrls) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(1200) });
        if (res.ok) return true;
      } catch {
        // try next
      }
    }
    return false;
  },

  // 1. Metrics (Total Files, Type Breakdown, Accuracy, Last Scan Time)
  async getMetrics() {
    return requestApi('/metrics');
  },

  // 2. Recommendations
  async getRecommendations(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return requestApi(`/files/recommendations${queryStr}`);
  },

  // 3. Upload & Ingest
  async uploadFiles(fileList) {
    const formData = new FormData();
    for (const f of fileList) {
      formData.append('files', f);
    }
    return requestApi('/files/upload', {
      method: 'POST',
      body: formData
    });
  },

  // 4. On-demand Summarization (Short or Detailed)
  async summarizeFile(fileId, mode = 'short') {
    return requestApi(`/files/${fileId}/summarize?mode=${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
  },

  // 5. Download Organized Folder Structure as ZIP
  async downloadOrganizedZip() {
    const downloadUrls = [
      `${PRIMARY_BASE}/files/download-zip`,
      `${DIRECT_BACKEND}/files/download-zip`,
      `${LOCALHOST_BACKEND}/files/download-zip`
    ];

    let lastError = null;
    for (const url of downloadUrls) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'No organized files available for download');
        }
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'SmartFolder_Organized.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        return true;
      } catch (err) {
        lastError = err;
        if (err.message && !err.message.includes('Failed to fetch')) {
          throw err;
        }
      }
    }
    throw lastError || new Error('Failed to download organized ZIP. Ensure backend is running.');
  },

  // 6. Approve & Move
  async approveMove(fileId, targetFolder) {
    return requestApi(`/files/${fileId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetFolder })
    });
  },

  // 7. Reassign
  async reassignFolder(fileId, newFolder) {
    return requestApi(`/files/${fileId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newFolder })
    });
  },

  // 8. Dismiss
  async dismissFile(fileId) {
    return requestApi(`/files/${fileId}/dismiss`, {
      method: 'DELETE'
    });
  },

  // 9. Batch actions
  async batchApprove(fileIds) {
    return requestApi('/files/batch-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds })
    });
  },

  async batchDismiss(fileIds) {
    return requestApi('/files/batch-dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds })
    });
  },

  // 10. Folder Tree
  async getFolderTree() {
    return requestApi('/folders/tree');
  },

  async createFolder(name, parentPath = null) {
    return requestApi('/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentPath })
    });
  },

  async renameFolder(folderId, newName) {
    return requestApi(`/folders/${folderId}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName })
    });
  },

  async deleteFolder(folderId, moveToFolder = 'Other Files/') {
    const params = new URLSearchParams({ moveToFolder });
    return requestApi(`/folders/${folderId}?${params.toString()}`, {
      method: 'DELETE'
    });
  },

  async getFolderFiles(folderId) {
    return requestApi(`/folders/${folderId}/files`);
  },

  // 11. Cluster Suggestions
  async getClusterSuggestions() {
    return requestApi('/clusters/suggestions');
  },

  // 12. Advanced 8-Part Structured Document Summary
  async getStructuredSummary(fileId) {
    return requestApi(`/files/${fileId}/structured-summary`, {
      method: 'POST'
    });
  },

  // 13. Multi-Document Combined Synthesis
  async getCombinedSummary(fileIds = null) {
    return requestApi('/files/combined-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileIds ? { fileIds } : {})
    });
  },

  // 14. Previous Summaries History
  async getSummaryHistory() {
    return requestApi('/files/summary-history');
  },

  // 15. Storage Transparency & Disk Usage Info
  async getStorageInfo() {
    return requestApi('/files/storage-info');
  },

  // 16. Rename File
  async renameFile(fileId, newName) {
    return requestApi(`/files/${fileId}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName })
    });
  },

  // 17. Move File
  async moveFile(fileId, targetFolder) {
    return requestApi(`/files/${fileId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetFolder })
    });
  },

  // Delete file permanently
  async deleteFile(fileId) {
    return requestApi(`/files/${fileId}`, { method: 'DELETE' });
  },

  // Download individual file
  downloadFile(fileId, filename) {
    const urls = [
      `${PRIMARY_BASE}/files/${fileId}/download`,
      `${DIRECT_BACKEND}/files/${fileId}/download`,
      `${LOCALHOST_BACKEND}/files/${fileId}/download`
    ];
    // Try each URL to download
    const url = urls[1]; // use direct backend for binary download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // Content-based organization
  async contentOrganize(fileIds) {
    return requestApi('/files/content-organize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, method: 'content' })
    });
  },

  // Multi-mode summary (short/detailed/points/exam)
  async summarizeMultipleMode(fileIds, mode = 'short') {
    return requestApi('/files/summarize-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, mode })
    });
  },

  // Activity history
  async getActivityHistory(params = {}) {
    const q = new URLSearchParams();
    if (params.limit) q.append('limit', params.limit);
    if (params.offset) q.append('offset', params.offset);
    if (params.type && params.type !== 'all') q.append('activity_type', params.type);
    if (params.search) q.append('search', params.search);
    return requestApi(`/activity?${q.toString()}`);
  },

  async getRecentActivity(limit = 5) {
    return requestApi(`/activity/recent?limit=${limit}`);
  },

  async clearActivityHistory() {
    return requestApi('/activity/clear', { method: 'DELETE' });
  },

  // Delete file from storage
  async deleteFileRecord(fileId) {
    return requestApi(`/files/${fileId}`, { method: 'DELETE' });
  },

  // Get all files (all statuses)
  async getAllFiles() {
    return requestApi('/files/recommendations?status=all');
  }
};


