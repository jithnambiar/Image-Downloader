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
  ShieldCheck, Scale, ShieldAlert, Check, FileText, BookOpen
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
  const [activeTab, setActiveTab] = useState<'scraper' | 'collections' | 'settings' | 'blog'>('scraper');
  const [darkMode, setDarkMode] = useState(false);
  const [online, setOnline] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'blue' | 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate'>('blue');

  const [showConsentModal, setShowConsentModal] = useState(() => {
    return localStorage.getItem('compliance_consent') !== 'accepted';
  });

  const handleAcceptConsent = () => {
    localStorage.setItem('compliance_consent', 'accepted');
    setShowConsentModal(false);
    triggerToast('Access Approved', 'Welcome to the Compliance Sandbox Environment.');
  };

  // Custom Toast Notification States
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });

  // Initialize Dark Mode & Online Checkers
  useEffect(() => {
    // Determine system / profile dark mode settings
    const savedProfile = db.getUserProfile();
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedProfile.offlineMode ? false : isSystemDark; // Default simple check

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
        <div className="hidden md:flex items-center gap-4">
          
          {/* Connection Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase border transition-all ${
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

          <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-700/40 text-xs text-slate-600 dark:text-slate-300 font-semibold font-mono">
            <User className="h-4 w-4 text-slate-400" />
            <span>mjtirur@gmail.com</span>
          </div>

        </div>

        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* MASTER PAGE CONTAINERS */}
      <div className="max-w-7xl mx-auto flex">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col gap-1 w-64 shrink-0 min-h-[calc(100vh-73px)] border-r border-slate-200/80 dark:border-slate-850 p-5 bg-white/30 dark:bg-slate-900/10">
          
          <button
            onClick={() => setActiveTab('scraper')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'scraper'
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <Compass className="h-4.5 w-4.5" />
            <span>Crawler Dashboard</span>
          </button>
 
          <button
            onClick={() => setActiveTab('collections')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'collections'
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <FolderHeart className="h-4.5 w-4.5" />
            <span>Saved Collections</span>
          </button>
 
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <Settings className="h-4.5 w-4.5" />
            <span>Settings & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('blog')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'blog'
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            <span>SEO Knowledge Hub</span>
          </button>
 
          <div className="mt-auto pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500 font-mono flex flex-col gap-1">
            <div>Developer Workspace v1.0.4</div>
            <div>Database Engine: IndexedDB</div>
            <div>Offline Sync Status: Synced</div>
          </div>
        </aside>
 
        {/* ACTIVE CONTENT WORKSPACE */}
        <main className="flex-1 p-6 md:p-8 min-h-[calc(100vh-73px)] overflow-hidden">
          {activeTab === 'scraper' && (
            <ImageScraper 
              onShowNotification={triggerToast} 
              onNavigateToCollections={() => setActiveTab('collections')}
            />
          )}
          {activeTab === 'collections' && (
            <CollectionsManager onShowNotification={triggerToast} />
          )}
          {activeTab === 'settings' && (
            <SettingsManager 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              onShowNotification={triggerToast} 
              currentTheme={theme}
              onChangeTheme={setTheme}
            />
          )}
          {activeTab === 'blog' && (
            <BlogPage onBackToDashboard={() => setActiveTab('scraper')} />
          )}
        </main>
      </div>

      {/* FOOTER & SEO RESOURCE HUBS */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 mt-12 py-12 px-6 md:px-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto">
          {/* SEO Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-8 mb-8 text-center md:text-left">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-display">
              Universal Bulk Image Downloader & Media Extractor
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              The premier web crawler designed to scrape, extract, optimize, and organize high-resolution images and visual media from the web's most popular platforms including Instagram, TikTok, Twitter/X, Pinterest, YouTube, Reddit, Facebook, and any other web page. Convert formats and batch download media into structured ZIP files seamlessly.
            </p>
          </div>

          {/* SEO Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs text-slate-500">
            {/* Column 1: Social Media Scraper */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Supported Platforms
              </h3>
              <ul className="flex flex-col gap-2 font-medium">
                <li>
                  <span className="text-blue-500 font-semibold">Instagram Downloader</span>: Extract high-resolution post photos, carousel slide decks, and Reels covers by pasting any URL or embed code.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">TikTok Cover Grabber</span>: Parse video short links to grab original poster cover frames in standard portrait aspect ratios.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">X / Twitter Media Extractor</span>: Gather original high-definition post attachments, illustrations, and user media quickly.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">YouTube Thumbnail Grabber</span>: Save video preview frames up to Ultra-HD (maxresdefault) resolution instantly.
                </li>
              </ul>
            </div>

            {/* Column 2: Advanced Extraction */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Advanced Image Extraction
              </h3>
              <ul className="flex flex-col gap-2 font-medium">
                <li>
                  <span className="text-blue-500 font-semibold">Reddit Gallery Downloader</span>: Easily extract structured multi-image gallery files and original post attachments directly.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">Pinterest Pin Grabber</span>: Fetch original pinned images, boards, and visual references in full native resolution formats.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">Facebook Photo Extractor</span>: Download timeline media, headers, and album images effortlessly.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">Generic URL Web Crawler</span>: Scrape images, icons, and figures from any blogs, news feeds, galleries, and Wikipedia pages.
                </li>
              </ul>
            </div>

            {/* Column 3: Conversion & Optimization */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                On-The-Fly Image Sizing
              </h3>
              <ul className="flex flex-col gap-2 font-medium">
                <li>
                  <span className="text-blue-500 font-semibold">Original Resolution</span>: Keep full raw dimensions and lossless format encoding exactly as published online.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">Large & Medium Format</span>: Auto-downsample to standard landscape margins (1920px / 1200px max) for responsive screen media layouts.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">Small & Thumbnail Sizes</span>: Instantly compress to lightweight web-ready assets (800px / 400px max) optimized for lightning-fast page loading speeds.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">Format Transcoding</span>: Convert downloaded files to popular WebP, JPEG, or PNG standards with interactive quality controls.
                </li>
              </ul>
            </div>

            {/* Column 4: Local Storage Organizer */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Offline Organizing & Safety
              </h3>
              <ul className="flex flex-col gap-2 font-medium">
                <li>
                  <span className="text-blue-500 font-semibold">IndexedDB Storage Sandbox</span>: Keep your assets categorized in offline-first safe browser storage. No server uploads.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">Custom Collection Folders</span>: Create dedicated folders to separate mood boards, reference materials, and social campaigns.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">Bulk ZIP Compression</span>: Compile select assets into a clean ZIP folder with dynamic sequence naming templates.
                </li>
                <li>
                  <span className="text-blue-500 font-semibold">Privacy Compliance</span>: Scrapes directly using client-side pipelines and secure API relays, protecting user privacy limits.
                </li>
              </ul>
            </div>
          </div>

          {/* Legal Disclaimer & Copyright footer */}
          <div className="border-t border-slate-100 dark:border-slate-800/60 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                © 2026 Bulk Image Downloader & Organizer. All Rights Reserved.
              </span>
              <p className="text-[10px] text-slate-400 max-w-2xl leading-normal">
                All product names, logos, brands, and registered trademarks belong to their respective owners. Their mention here is purely for identification, capability explanation, and referencing purposes, and does not imply any official endorsement or partnership. Media downloads must respect local copyright laws and creator guidelines.
              </p>
            </div>
            
            <div className="flex items-center gap-3.5 text-[10px] font-bold text-slate-400">
              <span className="hover:text-blue-500 cursor-pointer">Terms of Service</span>
              <span className="text-slate-200 dark:text-slate-800">|</span>
              <span className="hover:text-blue-500 cursor-pointer">Privacy Policy</span>
              <span className="text-slate-200 dark:text-slate-800">|</span>
              <span className="hover:text-blue-500 cursor-pointer">API Status</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE NAV DECK (Stick to bottom on portable screens) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 px-4 py-2 flex justify-around">
        <button
          onClick={() => { setActiveTab('scraper'); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${
            activeTab === 'scraper' ? 'text-brand' : 'text-slate-400'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-[9px] font-bold">Scraper</span>
        </button>

        <button
          onClick={() => { setActiveTab('collections'); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${
            activeTab === 'collections' ? 'text-brand' : 'text-slate-400'
          }`}
        >
          <FolderHeart className="h-5 w-5" />
          <span className="text-[9px] font-bold">Collections</span>
        </button>

        <button
          onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${
            activeTab === 'settings' ? 'text-brand' : 'text-slate-400'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[9px] font-bold">Security</span>
        </button>

        <button
          onClick={() => { setActiveTab('blog'); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${
            activeTab === 'blog' ? 'text-brand' : 'text-slate-400'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[9px] font-bold">SEO Blog</span>
        </button>
      </div>

      {/* MOBILE OVERLAY DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-[73px] right-0 w-64 h-fit bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800/80 shadow-2xl p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account diagnostics</span>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
              <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">mjtirur@gmail.com</span>
                <span className="text-[9px] font-mono text-slate-400">Connected</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-850 pt-3">
              <div className="flex items-center justify-between text-xs px-2 py-1">
                <span className="text-slate-500 font-semibold">Active Mode</span>
                <span className="font-bold text-blue-500 font-mono">Full-Stack v1</span>
              </div>
              <div className="flex items-center justify-between text-xs px-2 py-1">
                <span className="text-slate-500 font-semibold">Offline Status</span>
                <span className="font-bold text-emerald-500 font-mono">Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST SLIDE NOTIFICATION */}
      <div className={`fixed bottom-16 md:bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl py-3.5 px-4 max-w-sm flex items-start gap-3 shadow-xl transition-all duration-300 transform ${
        toast.show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'
      }`}>
        <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <h5 className="text-xs font-bold font-display">{toast.title}</h5>
          <p className="text-[11px] text-slate-300 leading-normal">{toast.message}</p>
        </div>
      </div>

      {/* COMPLIANCE OVERLAY INTERSTITIAL (LOCKED ON WEBSITE LOADING TIME) */}
      <AnimatePresence>
        {showConsentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
            id="compliance-gate"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -15, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] max-w-2xl w-full p-6 md:p-8 shadow-2xl relative my-auto flex flex-col gap-6"
            >
              {/* Header Visual */}
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                <div className="p-3.5 bg-amber-500/10 dark:bg-amber-500/5 text-amber-500 rounded-2xl ring-4 ring-amber-500/5 animate-pulse">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 dark:bg-amber-500/5 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                      Sandbox Gate
                    </span>
                    <span className="text-[10px] font-bold font-mono text-slate-400">
                      Compliance Authorized Mode
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-display mt-1">
                    Compliance Sandbox Authorization
                  </h3>
                </div>
              </div>

              {/* Informative Grid/Content */}
              <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-600 dark:text-slate-350">
                <p className="text-[12px] md:text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                  Welcome to the **Bulk Image Downloader & Organizer**. Before launching the crawler workspace, you must review and accept our fair use, GDPR sandbox, and educational research compliance policy.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  {/* Guideline 1 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150/50 dark:border-slate-800/50 rounded-2xl flex gap-3">
                    <BookOpen className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Educational & Mockup Use</h4>
                      <p className="text-[10px] leading-normal text-slate-400 dark:text-slate-500 mt-1">
                        This environment is configured strictly for interface mockups, personal research, and non-commercial design studies.
                      </p>
                    </div>
                  </div>

                  {/* Guideline 2 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150/50 dark:border-slate-800/50 rounded-2xl flex gap-3">
                    <Scale className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Strict Fair-Use Standards</h4>
                      <p className="text-[10px] leading-normal text-slate-400 dark:text-slate-500 mt-1">
                        Downloading copyrighted images from third-party networks without the owner's permission or valid licensing is unauthorized.
                      </p>
                    </div>
                  </div>

                  {/* Guideline 3 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150/50 dark:border-slate-800/50 rounded-2xl flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">GDPR Local Sandbox</h4>
                      <p className="text-[10px] leading-normal text-slate-400 dark:text-slate-500 mt-1">
                        All downloaded images, folders, and customized metadata remain fully local (IndexedDB) with zero telemetry tracking.
                      </p>
                    </div>
                  </div>

                  {/* Guideline 4 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150/50 dark:border-slate-800/50 rounded-2xl flex gap-3">
                    <FileText className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Operator Responsibility</h4>
                      <p className="text-[10px] leading-normal text-slate-400 dark:text-slate-500 mt-1">
                        The operator assumes full liability for all scraped URIs. We never host, cache, or redistribute downloaded assets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Agreement Toggle */}
              <div className="border-t border-slate-150/70 dark:border-slate-800/60 pt-5 mt-1 flex flex-col gap-4">
                <p className="text-[10px] leading-normal text-center text-slate-400 dark:text-slate-500 font-semibold max-w-md mx-auto">
                  By clicking below, you certify that you understand the terms of educational fair use and possess the rights or exemptions necessary to analyze target websites.
                </p>

                <button
                  onClick={handleAcceptConsent}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-2xl shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="h-4.5 w-4.5" />
                  <span>Accept &amp; Initialize Sandbox Workspace</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
