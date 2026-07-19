/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { db, isOnline } from './utils/db';
import ImageScraper from './components/ImageScraper';
import CollectionsManager from './components/CollectionsManager';
import SettingsManager from './components/SettingsManager';
import BlogPage from './components/BlogPage';
import { 
  Compass, FolderHeart, Settings, Zap, 
  Menu, X, Wifi, WifiOff, Bell, User, CheckCircle,
  ShieldCheck, Scale, ShieldAlert, Check, FileText, BookOpen,
  Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const THEME_PRESETS = {
  blue: {
    id: 'blue' as const,
    name: 'Classic Blue',
    description: 'Modern clean look with deep oceanic blue accents',
    primary: '#2563eb',
    hover: '#1d4ed8',
    light: '#eff6ff',
    glow: 'rgba(37, 99, 235, 0.2)',
    from: '#3b82f6',
    to: '#4f46e5',
    colorClasses: 'from-blue-500 to-indigo-600',
    dotBg: 'bg-blue-600',
  },
  indigo: {
    id: 'indigo' as const,
    name: 'Royal Indigo',
    description: 'Sophisticated royal aesthetics with midnight violet glow',
    primary: '#4f46e5',
    hover: '#4338ca',
    light: '#e0e7ff',
    glow: 'rgba(79, 70, 229, 0.2)',
    from: '#6366f1',
    to: '#7c3aed',
    colorClasses: 'from-indigo-500 to-violet-600',
    dotBg: 'bg-indigo-600',
  },
  emerald: {
    id: 'emerald' as const,
    name: 'Emerald Forest',
    description: 'Fresh organic greens and crisp nature vibes',
    primary: '#059669',
    hover: '#047857',
    light: '#ecfdf5',
    glow: 'rgba(5, 150, 105, 0.2)',
    from: '#10b981',
    to: '#059669',
    colorClasses: 'from-emerald-500 to-teal-600',
    dotBg: 'bg-emerald-600',
  },
  violet: {
    id: 'violet' as const,
    name: 'Cosmic Violet',
    description: 'Futuristic neon synthwave and creative purple hues',
    primary: '#7c3aed',
    hover: '#6d28d9',
    light: '#f5f3ff',
    glow: 'rgba(124, 58, 237, 0.2)',
    from: '#8b5cf6',
    to: '#ec4899',
    colorClasses: 'from-violet-500 to-pink-600',
    dotBg: 'bg-violet-600',
  },
  amber: {
    id: 'amber' as const,
    name: 'Sunset Amber',
    description: 'Warm light settings with cozy golden-hour glow',
    primary: '#d97706',
    hover: '#b45309',
    light: '#fffbeb',
    glow: 'rgba(217, 119, 6, 0.2)',
    from: '#f59e0b',
    to: '#ea580c',
    colorClasses: 'from-amber-500 to-orange-600',
    dotBg: 'bg-amber-600',
  },
  rose: {
    id: 'rose' as const,
    name: 'Sunset Rose',
    description: 'Vibrant coral pinks and elegant crimson details',
    primary: '#db2777',
    hover: '#be185d',
    light: '#fff1f2',
    glow: 'rgba(219, 39, 119, 0.2)',
    from: '#f43f5e',
    to: '#db2777',
    colorClasses: 'from-rose-500 to-pink-600',
    dotBg: 'bg-rose-600',
  },
  slate: {
    id: 'slate' as const,
    name: 'Charcoal Slate',
    description: 'Minimalist industrial dark slate and high-contrast charcoal',
    primary: '#475569',
    hover: '#334155',
    light: '#f1f5f9',
    glow: 'rgba(71, 85, 105, 0.2)',
    from: '#64748b',
    to: '#475569',
    colorClasses: 'from-slate-500 to-slate-700',
    dotBg: 'bg-slate-600',
  }
};

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [online, setOnline] = useState(true);
  const [theme, setTheme] = useState<'blue' | 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate'>('blue');

  // Custom Toast Notification States
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });

  // Initialize Dark Mode & Online Checkers
  useEffect(() => {
    const savedProfile = db.getUserProfile();
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedProfile.offlineMode ? false : isSystemDark;

    if (savedProfile.theme) {
      setTheme(savedProfile.theme);
    }

    setDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setOnline(isOnline());
    const handleOnlineStatus = () => setOnline(isOnline());

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Update theme properties on root
  useEffect(() => {
    const root = document.documentElement;
    const preset = THEME_PRESETS[theme];
    if (preset) {
      root.style.setProperty('--brand-color', preset.primary);
      root.style.setProperty('--brand-hover', preset.hover);
      root.style.setProperty('--brand-light', preset.light);
      root.style.setProperty('--brand-glow', preset.glow);
      root.style.setProperty('--brand-gradient-from', preset.from);
      root.style.setProperty('--brand-gradient-to', preset.to);
    }
  }, [theme]);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    triggerToast('Theme Updated', `Switched to ${nextDark ? 'Dark' : 'Light'} mode`);
  };

  const triggerToast = (title: string, message: string) => {
    setToast({ show: true, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-850 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-linear-to-tr from-brand-from to-brand-to rounded-xl text-white shadow-md shadow-brand/20">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight font-display text-slate-800 dark:text-slate-100">
              Bulk Image Downloader & Organizer
            </h1>
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              High-Speed Asset Pipeline
            </span>
          </div>
        </div>

        {/* Global Controls & Diagnostics */}
        <div className="flex items-center gap-3">
          
          {/* Connection Pill */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase border transition-all ${
            online 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
              : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
          }`}>
            {online ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span>Cloud Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                <span>Offline Safe Mode</span>
              </>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200/40 dark:border-slate-700/40 transition-colors"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="hidden md:flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-700/40 text-xs text-slate-600 dark:text-slate-300 font-semibold font-mono">
            <User className="h-4 w-4 text-slate-400" />
            <span>mjtirur@gmail.com</span>
          </div>

        </div>
      </header>

      {/* MASTER PAGE CONTAINERS */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* ACTIVE CONTENT WORKSPACE */}
        <main className="w-full min-h-[calc(100vh-140px)] overflow-hidden">
          <ImageScraper 
            onShowNotification={triggerToast} 
            onNavigateToCollections={() => {}}
          />
        </main>
      </div>

      {/* FOOTER & SEO RESOURCE HUBS */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 py-8 px-6 md:px-12 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="text-[11px] font-bold tracking-wide uppercase">Local Sandbox Active Notice</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal text-center md:text-left max-w-4xl font-medium">
              Notice: This media crawler tool is designed strictly for research, educational studies, and interface mockup tasks. All file conversions, naming templates, and ZIP generation run fully inside your local browser memory (no server logs, uploads, or telemetry). Please ensure you respect copyrights and platform policies of original publishers.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-400">
            <div className="flex flex-col gap-0.5 text-center md:text-left">
              <span>© 2026 Bulk Image Downloader & Organizer. All Rights Reserved.</span>
              <span className="text-[9px] font-normal text-slate-400">
                All brand logos, trademarks, and registered assets remain properties of their respective owners. Mention is for reference and compatibility explanation only.
              </span>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="hover:text-blue-500 cursor-pointer">Terms of Service</span>
              <span className="text-slate-200 dark:text-slate-850">|</span>
              <span className="hover:text-blue-500 cursor-pointer">Privacy Policy</span>
            </div>
          </div>
        </div>
      </footer>

      {/* GLOBAL TOAST SLIDE NOTIFICATION */}
      <div className={`fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl py-3.5 px-4 max-w-sm flex items-start gap-3 shadow-xl transition-all duration-300 transform ${
        toast.show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'
      }`}>
        <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <h5 className="text-xs font-bold font-display">{toast.title}</h5>
          <p className="text-[11px] text-slate-300 leading-normal">{toast.message}</p>
        </div>
      </div>

    </div>
  );
}
