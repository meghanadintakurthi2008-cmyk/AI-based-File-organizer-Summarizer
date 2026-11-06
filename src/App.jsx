import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

import DashboardPage from './pages/DashboardPage';
import OrganizePage from './pages/OrganizePage';
import OrganizeAIPage from './pages/OrganizeAIPage';
import OrganizeUserPage from './pages/OrganizeUserPage';
import OrganizeContentPage from './pages/OrganizeContentPage';
import SummarizePage from './pages/SummarizePage';
import MyFilesPage from './pages/MyFilesPage';
import ActivityPage from './pages/ActivityPage';

import { api } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem('smartfolder_page') || 'dashboard';
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('smartfolder_theme') === 'dark';
  });

  const [backendOnline, setBackendOnline] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Sync active page with localStorage
  const handleNavigate = (page) => {
    setActivePage(page);
    localStorage.setItem('smartfolder_page', page);
  };

  // Sync theme with document root class & localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('smartfolder_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('smartfolder_theme', 'light');
    }
  }, [darkMode]);

  // Periodic Backend health check every 5 seconds
  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      const isAlive = await api.checkHealth();
      if (isMounted) {
        setBackendOnline(isAlive);
      }
    }

    checkHealth();
    const intervalId = setInterval(checkHealth, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Toast Notification helper
  const addToast = (title, message = '', type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Render the current active page
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            backendOnline={backendOnline}
            onShowToast={addToast}
          />
        );
      case 'organize':
        return (
          <OrganizePage
            onNavigate={handleNavigate}
            backendOnline={backendOnline}
            onShowToast={addToast}
          />
        );
      case 'organize-ai':
        return (
          <OrganizeAIPage
            onNavigate={handleNavigate}
            onShowToast={addToast}
            backendOnline={backendOnline}
          />
        );
      case 'organize-user':
        return (
          <OrganizeUserPage
            onNavigate={handleNavigate}
            onShowToast={addToast}
            backendOnline={backendOnline}
          />
        );
      case 'organize-content':
        return (
          <OrganizeContentPage
            onNavigate={handleNavigate}
            onShowToast={addToast}
            backendOnline={backendOnline}
          />
        );
      case 'summarize':
        return (
          <SummarizePage
            onNavigate={handleNavigate}
            onShowToast={addToast}
            backendOnline={backendOnline}
          />
        );
      case 'myfiles':
        return (
          <MyFilesPage
            onNavigate={handleNavigate}
            onShowToast={addToast}
            backendOnline={backendOnline}
          />
        );
      case 'activity':
        return (
          <ActivityPage
            onNavigate={handleNavigate}
            onShowToast={addToast}
            backendOnline={backendOnline}
          />
        );
      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            backendOnline={backendOnline}
            onShowToast={addToast}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors font-sans">
      {/* Responsive Left Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        backendOnline={backendOnline}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
      />

      {/* Main Workspace Area (with top padding on mobile for the fixed header) */}
      <main className="flex-1 overflow-y-auto min-h-screen pt-14 md:pt-0">
        {renderPage()}
      </main>

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
