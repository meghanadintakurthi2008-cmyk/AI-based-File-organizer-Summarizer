const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export const api = {
  // Check backend health
  async checkHealth() {
    try {
      const res = await fetch('http://127.0.0.1:8000/health');
      return res.ok;
    } catch {
      return false;
    }
  },

  // 1. Metrics
  async getMetrics() {
    const res = await fetch(`${API_BASE_URL}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  // 2. Recommendations
  async getRecommendations(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.method) params.append('method', filters.method);
    if (filters.search) params.append('search', filters.search);
    if (filters.minConfidence) params.append('min_confidence', filters.minConfidence);

    const res = await fetch(`${API_BASE_URL}/files/recommendations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  // 3. Upload & Ingest
  async uploadFiles(fileList) {
    const formData = new FormData();
    for (const f of fileList) {
      formData.append('files', f);
    }
    const res = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Upload & classification failed');
    return res.json();
  },

  // 4. Approve & Move
  async approveMove(fileId, targetFolder) {
    const res = await fetch(`${API_BASE_URL}/files/${fileId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetFolder })
    });
    if (!res.ok) throw new Error('Failed to approve move');
    return res.json();
  },

  // 5. Reassign
  async reassignFolder(fileId, newFolder) {
    const res = await fetch(`${API_BASE_URL}/files/${fileId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newFolder })
    });
    if (!res.ok) throw new Error('Failed to reassign folder');
    return res.json();
  },

  // 6. Dismiss
  async dismissFile(fileId) {
    const res = await fetch(`${API_BASE_URL}/files/${fileId}/dismiss`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to dismiss file');
    return res.json();
  },

  // 7. Batch actions
  async batchApprove(fileIds) {
    const res = await fetch(`${API_BASE_URL}/files/batch-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds })
    });
    if (!res.ok) throw new Error('Batch approve failed');
    return res.json();
  },

  async batchDismiss(fileIds) {
    const res = await fetch(`${API_BASE_URL}/files/batch-dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds })
    });
    if (!res.ok) throw new Error('Batch dismiss failed');
    return res.json();
  },

  // 8. Folder Tree
  async getFolderTree() {
    const res = await fetch(`${API_BASE_URL}/folders/tree`);
    if (!res.ok) throw new Error('Failed to fetch folder tree');
    return res.json();
  },

  async createFolder(name, parentPath = null) {
    const res = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentPath })
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json();
  },

  // 9. Cluster Suggestions
  async getClusterSuggestions() {
    const res = await fetch(`${API_BASE_URL}/clusters/suggestions`);
    if (!res.ok) throw new Error('Failed to fetch cluster suggestions');
    return res.json();
  },

  async materializeCluster(clusterId) {
    const res = await fetch(`${API_BASE_URL}/clusters/${clusterId}/materialize`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to materialize cluster');
    return res.json();
  },

  async dismissCluster(clusterId) {
    const res = await fetch(`${API_BASE_URL}/clusters/${clusterId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to dismiss cluster');
    return res.json();
  }
};
