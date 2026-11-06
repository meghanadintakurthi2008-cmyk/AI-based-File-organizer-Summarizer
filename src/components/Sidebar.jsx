import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderTree,
  FileText,
  HardDrive,
  Clock,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export default function Sidebar({
  activePage,
  onNavigate,
  backendOnline = false,
  darkMode = false,
  onToggleDark = () => {}
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      activeMatches: ['dashboard']
    },
    {
      id: 'organize',
      label: 'Organize Files',
      icon: FolderTree,
      activeMatches: ['organize', 'organize-ai', 'organize-user', 'organize-content']
    },
    {
      id: 'summarize',
      label: 'Summarize Documents',
      icon: FileText,
      activeMatches: ['summarize']
    },
    {
      id: 'myfiles',
      label: 'My Files',
      icon: HardDrive,
      activeMatches: ['myfiles']
    },
    {
      id: 'activity',
      label: 'Activity History',
      icon: Clock,
      activeMatches: ['activity']
    }
  ];

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
      {/* Top Logo & Status */}
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <div
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
              SmartFolder<span className="text-indigo-600 dark:text-indigo-400">.AI</span>
            </div>
            <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 tracking-wide uppercase">
              Intelligent Workspace
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Backend Status indicator badge */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-zinc-400 font-medium">Backend Server</span>
        <div className="flex items-center gap-1.5 font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                : 'bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50'
            }`}
          />
          <span className={backendOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {backendOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.activeMatches.includes(activePage);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-500'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Actions: Theme Toggle & Version */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <button
          onClick={onToggleDark}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors w-full justify-between"
          title="Toggle light / dark mode"
        >
          <div className="flex items-center gap-2">
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-mono">
            {darkMode ? 'DARK' : 'LIGHT'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - Top Fixed Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-base">
            SmartFolder<span className="text-indigo-600">.AI</span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-64 max-w-[80vw] h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-zinc-800 h-screen sticky top-0 z-30 select-none">
        {sidebarContent}
      </aside>
    </>
  );
}
