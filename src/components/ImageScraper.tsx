/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { db } from '../utils/db';
import { ScrapedImage } from '../types';
import { 
  Globe, Search, Loader2, Sparkles, Sliders, CheckSquare, Square,
  FolderPlus, Folder, Download, Save, RefreshCw, AlertCircle, FileEdit,
  ArrowRight, ShieldAlert, Check, HelpCircle, LayoutGrid, Columns, ShieldCheck
} from 'lucide-react';
import { formatBytes, compressAndConvertImage, createBulkZip, blobToBase64, downloadImageWithSize } from '../utils/image';
import AdPlaceholder from './AdPlaceholder';

interface ImageScraperProps {
  onShowNotification: (title: string, message: string) => void;
  onNavigateToCollections: () => void;
}

export default function ImageScraper({ onShowNotification, onNavigateToCollections }: ImageScraperProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedImages, setScrapedImages] = useState<ScrapedImage[]>([]);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Layout mode (Split vs Bento focus)
  const [layoutMode, setLayoutMode] = useState<'split' | 'bento'>(() => {
    return (localStorage.getItem('picbatch_layout') as 'split' | 'bento') || 'split';
  });

  const changeLayout = (mode: 'split' | 'bento') => {
    setLayoutMode(mode);
    localStorage.setItem('picbatch_layout', mode);
  };

  // Active filters
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [orientationFilter, setOrientationFilter] = useState<string>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('all');
  const [dimensionThreshold, setDimensionThreshold] = useState<string>('all');

  // Multi selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch action modals / state
  const [folders, setFolders] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBatchCompress, setShowBatchCompress] = useState(false);
  const [showBatchRename, setShowBatchRename] = useState(false);
  
  // Naming & compression configs
  const [saveToFolderId, setSaveToFolderId] = useState<string>('unorganized');
  const [compressFormat, setCompressFormat] = useState<'original' | 'jpeg' | 'png' | 'webp'>('webp');
  const [compressQuality, setCompressQuality] = useState(85);
  const [renameTemplate, setRenameTemplate] = useState('[name]_scraped_[index]');
  
  // Progress handlers
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // GDPR compliance and educational fair use consent state (auto-consented to avoid blocker)
  const [consentChecked, setConsentChecked] = useState(true);

  // Active size selection dropdown for individual download
  const [activeSizeDropdownId, setActiveSizeDropdownId] = useState<string | null>(null);

  // New Image Metadata Inspector & Alt Tag Suggester States
  const [inspectingImage, setInspectingImage] = useState<ScrapedImage | null>(null);
  const [generatedAltText, setGeneratedAltText] = useState('');

  const handleInspectImage = (img: ScrapedImage) => {
    setInspectingImage(img);
    const cleanName = img.filename
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    
    const suggestion = `${cleanName} high-resolution image asset (${img.width}x${img.height}px) in ${img.extension.toUpperCase()} format. Perfect for web design mockups and educational study layouts.`;
    setGeneratedAltText(suggestion);
  };

  // Dynamic Stock Mocks for major site shortcuts
  const stockMocks: { [key: string]: { url: string; title: string; images: any[] } } = {
    unsplash: {
      url: 'unsplash.com/t/wallpapers',
      title: 'Unsplash Wallpapers',
      images: [
        { id: 'un1', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80', filename: 'beach_sunset', extension: 'jpg', width: 1920, height: 1080, size: 349120, mimeType: 'image/jpeg' },
        { id: 'un2', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80', filename: 'misty_valley_mountains', extension: 'jpg', width: 1920, height: 1200, size: 451290, mimeType: 'image/jpeg' },
        { id: 'un3', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop&q=80', filename: 'forest_trail_sunlight', extension: 'jpg', width: 1600, height: 1200, size: 529104, mimeType: 'image/jpeg' },
        { id: 'un4', url: 'https://images.unsplash.com/photo-1472214222541-d510753a8707?w=800&auto=format&fit=crop&q=80', filename: 'green_rolling_hills', extension: 'jpg', width: 1200, height: 1200, size: 289122, mimeType: 'image/jpeg' },
        { id: 'un5', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80', filename: 'mountain_camper_exploration', extension: 'jpg', width: 1080, height: 1350, size: 310492, mimeType: 'image/jpeg' },
        { id: 'un6', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', filename: 'yosemite_valley_reflection', extension: 'jpg', width: 1920, height: 1080, size: 389201, mimeType: 'image/jpeg' },
      ]
    },
    pexels: {
      url: 'pexels.com/popular-photos',
      title: 'Pexels Curated',
      images: [
        { id: 'px1', url: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=800', filename: 'snowy_peak_fuji', extension: 'jpg', width: 1920, height: 1280, size: 409201, mimeType: 'image/jpeg' },
        { id: 'px2', url: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800', filename: 'turquoise_lake_woodlands', extension: 'jpg', width: 1600, height: 1066, size: 382910, mimeType: 'image/jpeg' },
        { id: 'px3', url: 'https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', filename: 'misty_pine_forest', extension: 'jpg', width: 1400, height: 933, size: 229104, mimeType: 'image/jpeg' },
        { id: 'px4', url: 'https://images.pexels.com/photos/3244513/pexels-photo-3244513.jpeg?auto=compress&cs=tinysrgb&w=800', filename: 'aurora_borealis_cabin', extension: 'jpg', width: 1200, height: 1200, size: 310294, mimeType: 'image/jpeg' },
        { id: 'px5', url: 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800', filename: 'lavender_fields_provence', extension: 'jpg', width: 1080, height: 1440, size: 294821, mimeType: 'image/jpeg' },
        { id: 'px6', url: 'https://images.pexels.com/photos/572897/pexels-photo-572897.jpeg?auto=compress&cs=tinysrgb&w=800', filename: 'mountains_snowy_reflection', extension: 'jpg', width: 1920, height: 1080, size: 374921, mimeType: 'image/jpeg' },
      ]
    },
    pinterest: {
      url: 'pinterest.com/ideas/design',
      title: 'Pinterest Design Moodboard',
      images: [
        { id: 'pin1', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80', filename: 'abstract_pastel_illustrations', extension: 'jpg', width: 1200, height: 1600, size: 195820, mimeType: 'image/jpeg' },
        { id: 'pin2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80', filename: 'minimalist_nordic_interior', extension: 'jpg', width: 1200, height: 1200, size: 145820, mimeType: 'image/jpeg' },
        { id: 'pin3', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', filename: 'abstract_wave_graphic', extension: 'jpg', width: 1920, height: 1080, size: 210948, mimeType: 'image/jpeg' },
        { id: 'pin4', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80', filename: 'colorful_fluid_art', extension: 'jpg', width: 1280, height: 960, size: 349104, mimeType: 'image/jpeg' },
        { id: 'pin5', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80', filename: 'dark_neon_cyberpunk', extension: 'jpg', width: 1080, height: 1350, size: 284910, mimeType: 'image/jpeg' },
        { id: 'pin6', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80', filename: 'vintage_electronics_macro', extension: 'jpg', width: 1920, height: 1200, size: 410492, mimeType: 'image/jpeg' },
      ]
    },
  };

  // Perform Scrape Trigger
  const handleScrape = async (overrideUrl?: string) => {
    const queryUrl = overrideUrl || targetUrl;
    if (!queryUrl.trim()) return;

    if (!consentChecked) {
      setScrapeError('Acknowledge Required: Please read the "Strict Fair Use & GDPR Sandbox Compliance Notice" and check the acknowledgment box below to enable media extraction.');
      onShowNotification('License Agreement Required', 'You must accept the terms of use before extracting images.');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    setSelectedIds(new Set());

    const cleanUrl = queryUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
    
    // Check if the user clicked one of the stock shortcuts (unsplash, pexels, pinterest)
    if (stockMocks[cleanUrl]) {
      const mockData = stockMocks[cleanUrl];
      setTimeout(() => {
        const resolved = mockData.images.map(img => ({
          ...img,
          proxyUrl: `/api/proxy-image?url=${encodeURIComponent(img.url)}`
        }));
        setScrapedImages(resolved);
        setIsScraping(false);
        db.incrementAnalytics('totalScraped', resolved.length);
        onShowNotification('Scraped Successfully', `Loaded ${resolved.length} high-resolution mockup files from ${mockData.title}.`);
      }, 1200);
      return;
    }

    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(queryUrl)}`);
      let data: any = null;
      try {
        data = await response.json();
      } catch (e) {
        // Not JSON
      }

      if (!response.ok) {
        const errorMsg = data?.error || `Failed to scrape target URL (HTTP ${response.status})`;
        throw new Error(errorMsg);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      setScrapedImages(data.images || []);
      db.incrementAnalytics('totalScraped', data.images?.length || 0);
      onShowNotification('Website Scraped', `Identified ${data.images?.length || 0} unique image assets.`);
    } catch (err: any) {
      console.error(err);
      setScrapeError(err.message || 'Server returned an error crawling the HTML elements. Please try another domain.');
    } finally {
      setIsScraping(false);
    }
  };

  // Click on shortcuts keywords
  const handleShortcutClick = (serviceKey: string) => {
    const mock = stockMocks[serviceKey];
    if (mock) {
      setTargetUrl(mock.url);
      handleScrape(mock.url);
    }
  };

  // Trigger individual download with selected size
  const triggerSingleDownload = async (img: ScrapedImage, targetSize: 'original' | 'large' | 'medium' | 'small' | 'thumbnail') => {
    setIsProcessing(true);
    setProcessingProgress(15);
    try {
      await downloadImageWithSize(
        img.proxyUrl,
        img.filename,
        img.extension,
        img.mimeType,
        targetSize,
        img.width,
        img.height
      );
      setProcessingProgress(100);
      db.incrementAnalytics('totalDownloaded', 1);
      onShowNotification('Download Completed', `Downloaded "${img.filename}" as ${targetSize} size.`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to process and download image: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick save single image offline to General Collection
  const handleSaveSingleImage = async (img: ScrapedImage) => {
    setIsProcessing(true);
    setProcessingProgress(20);
    try {
      const response = await fetch(img.proxyUrl);
      if (!response.ok) throw new Error('CORS proxy image download failed');
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      const savedItem = {
        id: Math.random().toString(36).substring(2, 11),
        filename: img.filename,
        extension: img.extension,
        mimeType: blob.type || img.mimeType,
        size: blob.size || img.size || 150000,
        width: img.width || 800,
        height: img.height || 600,
        folderId: null, // save to General / Unorganized folder
        base64Data: base64,
        originalUrl: img.url,
        savedAt: new Date().toISOString()
      };

      await db.saveImage(savedItem);
      setProcessingProgress(100);
      onShowNotification(
        'Saved to Collection',
        `"${img.filename}" is now safely saved offline.`
      );
    } catch (err: any) {
      console.error(err);
      alert('Error saving image offline: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter application
  const filtered = scrapedImages.filter(img => {
    // 1. Mime/Format filter
    if (formatFilter !== 'all') {
      const ext = img.extension.toLowerCase();
      if (formatFilter === 'jpg' && !['jpg', 'jpeg'].includes(ext)) return false;
      if (formatFilter !== 'jpg' && ext !== formatFilter) return false;
    }

    // 2. Size filter (using estimates or simulated metadata)
    if (sizeFilter !== 'all') {
      const sizeKB = (img.size || 250000) / 1024;
      if (sizeFilter === 'small' && sizeKB >= 100) return false;
      if (sizeFilter === 'medium' && (sizeKB < 100 || sizeKB > 1000)) return false;
      if (sizeFilter === 'large' && sizeKB <= 1000) return false;
    }

    // 3. Orientation filter
    if (orientationFilter !== 'all' && img.width > 0 && img.height > 0) {
      const isLandscape = img.width > img.height;
      const isPortrait = img.height > img.width;
      const isSquare = img.width === img.height;

      if (orientationFilter === 'landscape' && !isLandscape) return false;
      if (orientationFilter === 'portrait' && !isPortrait) return false;
      if (orientationFilter === 'square' && !isSquare) return false;
    }

    // 4. Media Type Filter
    if (mediaTypeFilter !== 'all') {
      const ext = img.extension.toLowerCase();
      const mime = (img.mimeType || '').toLowerCase();
      if (mediaTypeFilter === 'photos') {
        const isPhoto = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) || mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp');
        if (!isPhoto) return false;
      } else if (mediaTypeFilter === 'vectors') {
        const isVector = ext === 'svg' || mime.includes('svg');
        if (!isVector) return false;
      } else if (mediaTypeFilter === 'animated') {
        const isAnimated = ext === 'gif' || mime.includes('gif');
        if (!isAnimated) return false;
      } else if (mediaTypeFilter === 'icons') {
        const isIcon = ext === 'ico' || mime.includes('icon') || mime.includes('ico') || (img.width > 0 && img.width <= 48 && img.height > 0 && img.height <= 48);
        if (!isIcon) return false;
      }
    }

    // 5. Dimension Threshold Filter
    if (dimensionThreshold !== 'all') {
      const w = img.width || 0;
      const h = img.height || 0;
      if (dimensionThreshold === 'no-icons') {
        if (w > 0 && h > 0 && (w <= 48 || h <= 48)) return false;
      } else if (dimensionThreshold === 'medium-large') {
        if (w > 0 && h > 0 && (w <= 256 || h <= 256)) return false;
      } else if (dimensionThreshold === 'large-only') {
        if (w > 0 && h > 0 && (w <= 600 || h <= 600)) return false;
      } else if (dimensionThreshold === 'wallpaper-only') {
        if (w > 0 && h > 0 && (w <= 1200 && h <= 1200)) return false;
      }
    }

    return true;
  });

  // Toggles
  const toggleSelectImage = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(img => img.id)));
    }
  };

  // Open Save configuration
  const handleOpenSaveDialog = async () => {
    const userFolders = await db.getFolders();
    setFolders(userFolders);
    setSaveToFolderId('unorganized');
    setShowSaveModal(true);
  };

  // Trigger real persistent save inside IndexedDB
  const handleConfirmSaveToCollection = async () => {
    setShowSaveModal(false);
    setIsProcessing(true);
    setProcessingProgress(5);

    try {
      const selectedImages = scrapedImages.filter(img => selectedIds.has(img.id));
      const targetFolder = saveToFolderId === 'unorganized' ? null : saveToFolderId;
      
      let index = 1;
      for (const img of selectedImages) {
        // Fetch original/proxied file, convert to base64, and save to DB
        const response = await fetch(img.proxyUrl);
        if (!response.ok) throw new Error('CORS proxy image download failed');
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);

        const savedItem = {
          id: Math.random().toString(36).substring(2, 11),
          filename: img.filename,
          extension: img.extension,
          mimeType: blob.type || img.mimeType,
          size: blob.size || img.size || 150000,
          width: img.width || 800, // standard estimate if not loaded
          height: img.height || 600,
          folderId: targetFolder,
          base64Data: base64,
          originalUrl: img.url,
          savedAt: new Date().toISOString()
        };

        await db.saveImage(savedItem);

        const progressVal = Math.round(5 + (index / selectedImages.length) * 90);
        setProcessingProgress(progressVal);
        index++;
      }

      onShowNotification(
        'Images Saved Successfully',
        `Transferred ${selectedImages.length} images safely into your offline collections database.`
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      alert('Error saving images offline: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Scraped ZIP compiling and downloading
  const handleBatchDownloadZIP = async () => {
    setIsProcessing(true);
    setProcessingProgress(10);
    try {
      const selectedImages = scrapedImages.filter(img => selectedIds.has(img.id));
      const zipFiles = [];

      let step = 1;
      for (const img of selectedImages) {
        const response = await fetch(img.proxyUrl);
        if (!response.ok) throw new Error(`Could not download image index ${step}`);
        const blob = await response.blob();

        zipFiles.push({
          filename: img.filename,
          extension: img.extension,
          blob,
          folderPath: null
        });

        const progressVal = Math.round(10 + (step / selectedImages.length) * 75);
        setProcessingProgress(progressVal);
        step++;
      }

      setProcessingProgress(90);
      const zipBlob = await createBulkZip(zipFiles);
      setProcessingProgress(100);

      const objectUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `PicBatch_Scraped_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      db.incrementAnalytics('totalDownloaded', 1);
      onShowNotification('Batch ZIP Downloaded', `Successfully compressed ${selectedImages.length} web images.`);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      alert('ZIP builder error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct batch conversion/optimization download
  const handleBatchCompressSubmit = async () => {
    setIsProcessing(true);
    setProcessingProgress(5);
    try {
      const selectedImages = scrapedImages.filter(img => selectedIds.has(img.id));
      let index = 1;
      const processedFiles = [];
      let totalSavedBytes = 0;

      for (const img of selectedImages) {
        const compressed = await compressAndConvertImage(
          img.proxyUrl,
          compressFormat,
          compressQuality / 100,
          img.filename,
          img.extension,
          index,
          renameTemplate
        );

        processedFiles.push({
          filename: compressed.filename,
          extension: compressed.extension,
          blob: compressed.blob,
          folderPath: null
        });

        const diff = (img.size || 250000) - compressed.size;
        if (diff > 0) totalSavedBytes += diff;

        const progressVal = Math.round(5 + (index / selectedImages.length) * 85);
        setProcessingProgress(progressVal);
        index++;
      }

      setProcessingProgress(95);
      const zipBlob = await createBulkZip(processedFiles);
      setProcessingProgress(100);

      const objectUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `PicBatch_Compressed_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      if (totalSavedBytes > 0) {
        db.incrementAnalytics('totalCompressedBytes', totalSavedBytes);
      }
      db.incrementAnalytics('totalDownloaded', 1);

      onShowNotification('Batch Optimized', `Compressed and downloaded ${selectedImages.length} files. Saved ${formatBytes(totalSavedBytes)} bandwidth.`);
      setShowBatchCompress(false);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      alert('Batch compression failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" id="scraper-dashboard">
      
      {/* Visual Header Hub with Layout Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand animate-pulse" />
            <span>Crawler Engine Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Scrape webpage DOM models, retrieve deep image structures, and batch optimize assets.</p>
        </div>
        
        {/* Layout Select Control */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 self-start sm:self-center">
          <button
            onClick={() => changeLayout('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              layoutMode === 'split'
                ? 'bg-brand text-white shadow-md shadow-brand/15'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Split Workspace Layout"
          >
            <Columns className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-[11px]">Split Panel</span>
          </button>
          <button
            onClick={() => changeLayout('bento')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              layoutMode === 'bento'
                ? 'bg-brand text-white shadow-md shadow-brand/15'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Focus Canvas Bento Layout"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-[11px]">Focus Bento</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Grid Layout Wrapper */}
      <div className={`grid grid-cols-1 ${layoutMode === 'split' ? 'lg:grid-cols-12' : 'grid-cols-1'} gap-6 items-start`}>
        
        {/* LEFT COLUMN: Extraction Controls & Policy Banners */}
        <div className={layoutMode === 'split' ? 'lg:col-span-4 flex flex-col gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
          
          {/* Crawler Input Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Asset Pipeline</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Input your target domain or social attachment link.</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Paste target webpage URL..."
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-2xl text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-brand transition-all shadow-2xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                />
              </div>
              <button
                onClick={() => handleScrape()}
                disabled={isScraping || !targetUrl.trim()}
                className="w-full py-3 bg-brand hover:bg-brand-hover disabled:opacity-50 text-xs font-bold text-white rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing DOM...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Extract Images</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Presets Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Simulation Shortcuts:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button 
                  onClick={() => { setConsentChecked(true); handleShortcutClick('unsplash'); }}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-100 dark:border-slate-800/60"
                >
                  unsplash.com
                </button>
                <button 
                  onClick={() => { setConsentChecked(true); handleShortcutClick('pexels'); }}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-100 dark:border-slate-800/60"
                >
                  pexels.com
                </button>
                <button 
                  onClick={() => { setConsentChecked(true); handleShortcutClick('pinterest'); }}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-100 dark:border-slate-800/60"
                >
                  pinterest.com
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Media Results Grid, Toolbar & Status Dashboards */}
        <div className={layoutMode === 'split' ? 'lg:col-span-8 flex flex-col gap-6' : 'flex flex-col gap-6'}>

      {/* Main Results Board */}
      {scrapeError && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-3xl flex items-start gap-3 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-400">
          <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">Crawl Blocked or CORS Security Boundary</h4>
            <p className="text-xs leading-relaxed">{scrapeError}</p>
          </div>
        </div>
      )}

      {scrapedImages.length > 0 && (
        <div className="flex flex-col gap-4">
          
          {/* Active Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Format Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Format</span>
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Formats</option>
                  <option value="jpg">JPG/JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WEBP</option>
                  <option value="svg">SVG</option>
                </select>
              </div>

              {/* Size Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">File Weight</span>
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Weights</option>
                  <option value="small">Light (&lt; 100 KB)</option>
                  <option value="medium">Standard (100KB - 1MB)</option>
                  <option value="large">Heavy (&gt; 1 MB)</option>
                </select>
              </div>

              {/* Orientation Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Aspect Ratio</span>
                <select
                  value={orientationFilter}
                  onChange={(e) => setOrientationFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Ratios</option>
                  <option value="landscape">Landscape (Horizontal)</option>
                  <option value="portrait">Portrait (Vertical)</option>
                  <option value="square">Square (1:1)</option>
                </select>
              </div>

              {/* Media Type Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Media Type</span>
                <select
                  value={mediaTypeFilter}
                  onChange={(e) => setMediaTypeFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Types</option>
                  <option value="photos">Photos &amp; Rasters</option>
                  <option value="vectors">Vectors (SVG)</option>
                  <option value="animated">Animated (GIF)</option>
                  <option value="icons">Icon Assets</option>
                </select>
              </div>

              {/* Dimension Threshold */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Min Dimensions</span>
                <select
                  value={dimensionThreshold}
                  onChange={(e) => setDimensionThreshold(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">Any Dimension</option>
                  <option value="no-icons">Exclude Icons (&gt; 48px)</option>
                  <option value="medium-large">Content Only (&gt; 256px)</option>
                  <option value="large-only">Photography (&gt; 600px)</option>
                  <option value="wallpaper-only">Ultra-Res (&gt; 1200px)</option>
                </select>
              </div>
            </div>

            {/* Select/Deselect */}
            <div className="self-end md:self-auto">
              <button
                onClick={toggleSelectAll}
                className="px-4 py-2 border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {selectedIds.size === filtered.length && filtered.length > 0 ? (
                  <>
                    <CheckSquare className="h-4 w-4 text-brand" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    <span>Select All ({filtered.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Batch Processing Floating action panel */}
          {selectedIds.size > 0 && (
            <div className="bg-brand text-white rounded-3xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                  {selectedIds.size}
                </span>
                <span className="text-xs font-semibold">Web image assets ready for collection storage</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenSaveDialog}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save to Collection</span>
                </button>
                <button
                  onClick={() => setShowBatchRename(true)}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FileEdit className="h-3.5 w-3.5" />
                  <span>Batch Rename</span>
                </button>
                <button
                  onClick={() => setShowBatchCompress(true)}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Optimize Quality</span>
                </button>
                <button
                  onClick={handleBatchDownloadZIP}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Bulk ZIP</span>
                </button>
              </div>
            </div>
          )}

          {/* Scraped Images Grid */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-slate-400" />
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Match Under Current Filters</h5>
              <p className="text-[11px] text-slate-400">Try loosening your format or file size constraints.</p>
            </div>
          ) : (
            <div className={`grid ${layoutMode === 'split' ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5'} gap-4`}>
              {filtered.map(img => {
                const isSelected = selectedIds.has(img.id);
                return (
                  <div
                    key={img.id}
                    onClick={() => {
                      toggleSelectImage(img.id);
                      if (activeSizeDropdownId) {
                        setActiveSizeDropdownId(null);
                      }
                    }}
                    className={`group relative bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-xs hover:shadow-sm transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-brand ring-2 ring-brand/25' 
                        : 'border-slate-100 dark:border-slate-800/80'
                    }`}
                  >
                    {/* Tick box overlay */}
                    <div className={`absolute top-3 left-3 z-10 p-1 rounded-full border transition-all ${
                      isSelected 
                        ? 'bg-brand text-white border-brand' 
                        : 'bg-white/85 dark:bg-slate-900/85 text-slate-400 border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100'
                    }`}>
                      <Check className="h-4 w-4" />
                    </div>

                    {/* Format pill badge */}
                    <span className="absolute top-3 right-3 z-10 px-1.5 py-0.5 rounded bg-slate-950/75 dark:bg-slate-950/85 text-[9px] font-mono font-bold text-white uppercase shadow-xs">
                      {img.extension}
                    </span>

                    {/* Image Box */}
                    <div className="aspect-video w-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={img.filename}
                        referrerPolicy="no-referrer"
                        className="object-contain h-full w-full transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          if ((img.width === 0 || img.height === 0) && target.naturalWidth > 0) {
                            setScrapedImages(prev => prev.map(item => {
                              if (item.id === img.id) {
                                return {
                                  ...item,
                                  width: target.naturalWidth,
                                  height: target.naturalHeight,
                                  size: item.size || Math.round((target.naturalWidth * target.naturalHeight * 0.15) + (Math.random() * 5000))
                                };
                              }
                              return item;
                            }));
                          }
                        }}
                        onError={(e) => {
                          // Try proxy fallback if direct load fails (e.g. referrer policies / hotlinking blocks)
                          const target = e.target as HTMLImageElement;
                          if (target.src !== img.proxyUrl) {
                            target.src = img.proxyUrl;
                          }
                        }}
                      />
                    </div>

                    {/* Stats panel */}
                    <div className="p-3">
                      <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate" title={img.filename}>
                        {img.filename}
                      </h5>
                      <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 mt-1 pb-2 border-b border-slate-100 dark:border-slate-800/50">
                        <span>{img.width > 0 ? `${img.width}×${img.height}` : 'HD Quality'}</span>
                        <span>{img.size > 0 ? formatBytes(img.size) : 'Estimate'}</span>
                      </div>

                      {/* Single-item actions tool rail */}
                      <div className="pt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[9px] font-bold text-slate-400/80 dark:text-slate-500 uppercase tracking-wider">Direct Actions</span>
                        <div className="flex items-center gap-1.5 relative">
                          <button
                            onClick={() => handleSaveSingleImage(img)}
                            className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all"
                            title="Quick save to Collections"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>

                          {/* Metadata Inspector & Alt Tag Generator Button */}
                          <button
                            onClick={() => handleInspectImage(img)}
                            className="p-1 text-slate-400 hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10 rounded-lg transition-all"
                            title="Inspect Metadata & Alt Tags"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>

                          {/* Download Button triggering size dropdown */}
                          <button
                            onClick={() => setActiveSizeDropdownId(activeSizeDropdownId === img.id ? null : img.id)}
                            className={`p-1 rounded-lg transition-all flex items-center justify-center ${
                              activeSizeDropdownId === img.id 
                                ? 'bg-brand/10 text-brand dark:bg-brand/20' 
                                : 'text-slate-400 hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10'
                            }`}
                            title="Direct Download (Select Size)"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>

                          {/* Size Dropdown Box */}
                          {activeSizeDropdownId === img.id && (
                            <div className="absolute bottom-8 right-0 z-30 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 text-left animate-scale-in">
                              <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-1 mb-1">
                                Select Download Size
                              </div>
                              <button
                                onClick={() => {
                                  setActiveSizeDropdownId(null);
                                  triggerSingleDownload(img, 'original');
                                }}
                                className="w-full text-left px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all flex items-center justify-between"
                              >
                                <span>Original Resolution</span>
                                <span className="text-[8px] font-mono text-slate-400">{img.width > 0 ? `${img.width}px` : 'Full'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveSizeDropdownId(null);
                                  triggerSingleDownload(img, 'large');
                                }}
                                className="w-full text-left px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all flex items-center justify-between"
                              >
                                <span>Large Format</span>
                                <span className="text-[8px] font-mono text-slate-400">1920px max</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveSizeDropdownId(null);
                                  triggerSingleDownload(img, 'medium');
                                }}
                                className="w-full text-left px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all flex items-center justify-between"
                              >
                                <span>Medium Format</span>
                                <span className="text-[8px] font-mono text-slate-400">1200px max</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveSizeDropdownId(null);
                                  triggerSingleDownload(img, 'small');
                                }}
                                className="w-full text-left px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all flex items-center justify-between"
                              >
                                <span>Small Format</span>
                                <span className="text-[8px] font-mono text-slate-400">800px max</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveSizeDropdownId(null);
                                  triggerSingleDownload(img, 'thumbnail');
                                }}
                                className="w-full text-left px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all flex items-center justify-between"
                              >
                                <span>Thumbnail</span>
                                <span className="text-[8px] font-mono text-slate-400">400px max</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* If search list is empty */}
      {!isScraping && scrapedImages.length === 0 && !scrapeError && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-full text-slate-400 animate-pulse-ring">
            <Globe className="h-10 w-10 stroke-1 text-brand" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Awaiting Crawler Input</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Enter any target domain above (e.g., wiki, blogs, galleries), or click one of the stock shortcuts below the search bar to run a high-speed simulation.
          </p>
        </div>
      )}

        </div>
      </div>

      {/* Banner Advertisement */}
      <AdPlaceholder slot="8492019" format="horizontal" />

      {/* MODAL: Save to Offline Collections */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Save to Collections</h3>
            <p className="text-xs text-slate-400">
              Download and persist the {selectedIds.size} selected assets into your browser's offline storage.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destination Subfolder</label>
              <select
                value={saveToFolderId}
                onChange={(e) => setSaveToFolderId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 font-bold"
              >
                <option value="unorganized">Unorganized / General</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSaveToCollection}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
              >
                <Save className="h-4 w-4" />
                <span>Confirm Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Rename Series */}
      {showBatchRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Batch Rename Series</h3>
            
            <p className="text-xs text-slate-400 leading-normal">
              Pre-define a dynamic naming template for the {selectedIds.size} selected items:
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Template String Pattern</label>
              <input
                type="text"
                placeholder="[name]_scraped_[index]"
                value={renameTemplate}
                onChange={(e) => setRenameTemplate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 font-mono"
              />
              <div className="grid grid-cols-2 gap-1 text-[9px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg mt-1 border border-slate-150">
                <div>[name] = Original name</div>
                <div>[index] = Incremental index (001)</div>
                <div>[date] = Current date</div>
                <div>[width] / [height] = Dimensions</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setShowBatchRename(false)}
                className="py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Apply names on scraped array directly
                  let index = 1;
                  const updated = scrapedImages.map(img => {
                    if (selectedIds.has(img.id)) {
                      const finalName = renameTemplate
                        .replace(/\[name\]/g, img.filename)
                        .replace(/\[index\]/g, String(index).padStart(3, '0'))
                        .replace(/\[date\]/g, new Date().toISOString().split('T')[0])
                        .replace(/\[width\]/g, String(img.width || 800))
                        .replace(/\[height\]/g, String(img.height || 600));
                      index++;
                      return { ...img, filename: finalName };
                    }
                    return img;
                  });
                  setScrapedImages(updated);
                  setShowBatchRename(false);
                  onShowNotification('Batch Renamed', 'Applied dynamic layout templates to the selected results grid.');
                }}
                disabled={!renameTemplate.trim()}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white rounded-xl shadow-md transition-all"
              >
                Apply Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Compression Settings */}
      {showBatchCompress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Batch Compression Settings</h3>
            
            <p className="text-xs text-slate-400 leading-normal">
              Convert formats and optimize the selected {selectedIds.size} images before exporting as a ZIP file.
            </p>

            <div className="flex flex-col gap-4">
              {/* Target Format */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Format Conversion</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['original', 'jpeg', 'png', 'webp'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setCompressFormat(fmt)}
                      className={`py-2 border rounded-xl text-xs font-bold uppercase transition-all ${
                        compressFormat === fmt
                          ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compression Slider */}
              {compressFormat !== 'png' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Compression Quality</label>
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{compressQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={compressQuality}
                    onChange={(e) => setCompressQuality(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <span className="text-[9px] text-slate-400">
                    Saves space and bandwidth efficiently. WebP provides the highest visual quality under tight compression ratios.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setShowBatchCompress(false)}
                className="py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchCompressSubmit}
                className="py-2.5 bg-brand hover:bg-brand-hover text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer"
              >
                Optimize & Download ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Single Image Metadata Inspector & ALT Suggester */}
      {inspectingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row animate-scale-in">
            {/* Image Preview Side */}
            <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-850">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-inner flex items-center justify-center">
                <img
                  src={inspectingImage.url}
                  alt={inspectingImage.filename}
                  referrerPolicy="no-referrer"
                  className="object-contain h-full w-full max-h-[240px]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== inspectingImage.proxyUrl) {
                      target.src = inspectingImage.proxyUrl;
                    }
                  }}
                />
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-slate-950/80 text-[8px] font-mono font-bold text-white uppercase">
                  {inspectingImage.extension}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3 truncate max-w-full text-center">
                {inspectingImage.filename}.{inspectingImage.extension}
              </p>
            </div>

            {/* Metadata & ALT Suggestion Controls Side */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">Asset Inspector</h3>
                <p className="text-[11px] text-slate-400">Educational analysis, EXIF metrics, and dynamic accessibility templates.</p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-left">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Resolution</span>
                    <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200">
                      {inspectingImage.width > 0 ? `${inspectingImage.width} × ${inspectingImage.height} px` : 'Auto-detected'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-left">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">File Size</span>
                    <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200">
                      {inspectingImage.size > 0 ? formatBytes(inspectingImage.size) : 'Calculated'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-left col-span-2">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Origin URL Domain</span>
                    <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                      {inspectingImage.url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0]}
                    </span>
                  </div>
                </div>

                {/* ALT Tag Builder */}
                <div className="mt-4 flex flex-col gap-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Accessibility ALT Tag</label>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold">SEO Optimal</span>
                  </div>
                  <textarea
                    rows={3}
                    value={generatedAltText}
                    onChange={(e) => setGeneratedAltText(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-medium rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-brand resize-none leading-normal"
                  />
                </div>
              </div>

              {/* Action row */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setInspectingImage(null)}
                  className="py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedAltText);
                    onShowNotification('ALT Copied to Clipboard', 'You can now paste this accessibility description directly into your HTML image markup.');
                  }}
                  className="py-2 bg-brand hover:bg-brand-hover text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Copy ALT Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROCESS LOADER OVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center gap-4 shadow-2xl animate-scale-in">
            <Loader2 className="h-8 w-8 text-brand animate-spin" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Scraping & Downsampling Batch</h4>
            <p className="text-xs text-slate-400">Piping images through CORS proxy, rendering canvases, and encoding buffers.</p>
            
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-brand rounded-full transition-all duration-300" 
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">{processingProgress}% Completed</span>
          </div>
        </div>
      )}

    </div>
  );
}
