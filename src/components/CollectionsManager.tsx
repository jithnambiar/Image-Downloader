/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { db, isOnline } from '../utils/db';
import { SavedImage, ImageFolder, CloudStorageConfig } from '../types';
import { 
  Folder, FolderPlus, Trash2, FileEdit, Download, CheckSquare, Square,
  FolderSync, UploadCloud, ChevronRight, Image as ImageIcon, Search,
  Settings, CheckCircle2, Sliders, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';
import { formatBytes, compressAndConvertImage, createBulkZip, base64ToBlob, blobToBase64, downloadImageWithSize } from '../utils/image';
import AdPlaceholder from './AdPlaceholder';

interface CollectionsManagerProps {
  onShowNotification: (title: string, message: string) => void;
}

export default function CollectionsManager({ onShowNotification }: CollectionsManagerProps) {
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'unorganized'>('all');
  
  // Selection
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // UI Modals / Toggles
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [showBatchMove, setShowBatchMove] = useState(false);
  const [showBatchRename, setShowBatchRename] = useState(false);
  const [showBatchCompress, setShowBatchCompress] = useState(false);
  const [targetFolderForMove, setTargetFolderForMove] = useState<string>('');
  
  // Batch Rename State
  const [renameTemplate, setRenameTemplate] = useState('[name]_opt_[index]');
  
  // Batch Compression State
  const [compressFormat, setCompressFormat] = useState<'original' | 'jpeg' | 'png' | 'webp'>('webp');
  const [compressQuality, setCompressQuality] = useState<number>(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Active size selection dropdown for individual download
  const [activeSizeDropdownId, setActiveSizeDropdownId] = useState<string | null>(null);

  // Connection State
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [syncLogsCount, setSyncLogsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Backup upload simulation
  const [cloudConfig, setCloudConfig] = useState<CloudStorageConfig>({
    googleDrive: { connected: false, email: null, lastBackup: null, autoBackup: false },
    dropbox: { connected: false, email: null, lastBackup: null, autoBackup: false },
  });
  const [isUploadingBackup, setIsUploadingBackup] = useState<string | null>(null); // service name
  const [backupProgress, setBackupProgress] = useState(0);

  useEffect(() => {
    loadData();
    setOnlineStatus(isOnline());

    const handleOnline = () => {
      setOnlineStatus(true);
      triggerAutoSync();
    };
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function loadData() {
    const f = await db.getFolders();
    const img = await db.getSavedImages();
    const config = db.getCloudConfig();
    const logs = db.getSyncLogs();
    
    setFolders(f);
    setSavedImages(img);
    setCloudConfig(config);
    setSyncLogsCount(logs.filter(l => l.status === 'pending').length);
  }

  const triggerAutoSync = async () => {
    setIsSyncing(true);
    const syncedCount = await db.syncPendingLogs();
    setIsSyncing(false);
    if (syncedCount > 0) {
      onShowNotification('Offline Work Synced', `Successfully synchronized ${syncedCount} modifications with the cloud server.`);
      loadData();
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const folderId = Math.random().toString(36).substring(2, 11);
    const folder: ImageFolder = {
      id: folderId,
      name: newFolderName.trim(),
      createdAt: new Date().toISOString()
    };

    if (!onlineStatus) {
      await db.addSyncLog('create_folder', folderId, folder);
    }
    await db.saveFolder(folder);
    setNewFolderName('');
    setShowCreateFolder(false);
    onShowNotification('Folder Created', `Folder "${folder.name}" is ready.`);
    loadData();
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    const confirmed = window.confirm(`Delete folder "${folderName}"? Images inside will not be deleted; they will be categorized under unorganized files.`);
    if (!confirmed) return;

    if (!onlineStatus) {
      await db.addSyncLog('delete_folder', folderId, null);
    }
    await db.deleteFolder(folderId);
    if (selectedFolderId === folderId) {
      setSelectedFolderId('all');
    }
    onShowNotification('Folder Removed', `Folder "${folderName}" was deleted.`);
    loadData();
  };

  // Image actions
  const handleDeleteImage = async (imageId: string, filename: string) => {
    const confirmed = window.confirm(`Delete image "${filename}" from your saved collections?`);
    if (!confirmed) return;

    if (!onlineStatus) {
      await db.addSyncLog('delete_image', imageId, null);
    }
    await db.deleteImage(imageId);
    const updatedSelected = new Set(selectedImageIds);
    updatedSelected.delete(imageId);
    setSelectedImageIds(updatedSelected);
    
    onShowNotification('Image Deleted', `"${filename}" was deleted from local disk.`);
    loadData();
  };

  const handleSingleRename = async (imageId: string, currentName: string, ext: string) => {
    const nextName = window.prompt('Rename saved image filename (excluding extension):', currentName);
    if (!nextName || !nextName.trim() || nextName === currentName) return;

    const img = savedImages.find(i => i.id === imageId);
    if (!img) return;

    const updatedImage = { ...img, filename: nextName.trim() };
    if (!onlineStatus) {
      await db.addSyncLog('rename_image', imageId, { filename: nextName.trim() });
    }
    await db.saveImage(updatedImage);
    onShowNotification('Image Renamed', `"${currentName}" is now "${nextName.trim()}"`);
    loadData();
  };

  // Selection toggle
  const toggleSelectImage = (id: string) => {
    const next = new Set(selectedImageIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedImageIds(next);
  };

  // Trigger individual download with selected size
  const triggerSingleDownload = async (img: SavedImage, targetSize: 'original' | 'large' | 'medium' | 'small' | 'thumbnail') => {
    setIsProcessing(true);
    setProcessingProgress(15);
    try {
      await downloadImageWithSize(
        img.base64Data,
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

  const toggleSelectAll = () => {
    if (selectedImageIds.size === filteredImages.length) {
      setSelectedImageIds(new Set());
    } else {
      setSelectedImageIds(new Set(filteredImages.map(img => img.id)));
    }
  };

  // Filtering
  const filteredImages = savedImages.filter(img => {
    // 1. Folder filter
    if (selectedFolderId === 'unorganized' && img.folderId !== null) return false;
    if (selectedFolderId !== 'all' && selectedFolderId !== 'unorganized' && img.folderId !== selectedFolderId) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        img.filename.toLowerCase().includes(q) || 
        img.extension.toLowerCase().includes(q) || 
        img.originalUrl.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Batch action executions
  const handleBatchDelete = async () => {
    const confirmed = window.confirm(`Permanently delete ${selectedImageIds.size} selected image(s) from local collections?`);
    if (!confirmed) return;

    for (const id of Array.from(selectedImageIds) as string[]) {
      if (!onlineStatus) {
        await db.addSyncLog('delete_image', id, null);
      }
      await db.deleteImage(id);
    }
    setSelectedImageIds(new Set());
    onShowNotification('Batch Deleted', `Deleted ${selectedImageIds.size} files.`);
    loadData();
  };

  const handleBatchMoveSubmit = async () => {
    const targetFolder = targetFolderForMove === 'unorganized' ? null : targetFolderForMove;
    const destName = targetFolder ? folders.find(f => f.id === targetFolder)?.name : 'Unorganized';

    for (const id of Array.from(selectedImageIds)) {
      const img = savedImages.find(i => i.id === id);
      if (img) {
        img.folderId = targetFolder;
        await db.saveImage(img);
      }
    }
    setShowBatchMove(false);
    setSelectedImageIds(new Set());
    onShowNotification('Batch Moved', `Relocated files to folder "${destName}".`);
    loadData();
  };

  const handleBatchRenameSubmit = async () => {
    let index = 1;
    for (const id of Array.from(selectedImageIds)) {
      const img = savedImages.find(i => i.id === id);
      if (img) {
        const parts = renameTemplate
          .replace(/\[name\]/g, img.filename)
          .replace(/\[index\]/g, String(index).padStart(3, '0'))
          .replace(/\[date\]/g, new Date().toISOString().split('T')[0])
          .replace(/\[width\]/g, String(img.width))
          .replace(/\[height\]/g, String(img.height));

        img.filename = parts.trim() || img.filename;
        await db.saveImage(img);
        index++;
      }
    }
    setShowBatchRename(false);
    setSelectedImageIds(new Set());
    onShowNotification('Batch Renamed', 'Dynamic template applied successfully.');
    loadData();
  };

  // Client-side ZIP Creation & Download
  const handleBatchDownloadZIP = async () => {
    setIsProcessing(true);
    setProcessingProgress(10);
    try {
      const zipFiles = [];
      const imagesToZip = savedImages.filter(img => selectedImageIds.has(img.id));
      
      let step = 1;
      for (const img of imagesToZip) {
        // Convert stored base64 image data to a standard binary Blob
        const blob = base64ToBlob(img.base64Data, img.mimeType);
        
        // Find folder path
        let folderPath = null;
        if (img.folderId) {
          const f = folders.find(fd => fd.id === img.folderId);
          if (f) folderPath = f.name;
        }

        zipFiles.push({
          filename: img.filename,
          extension: img.extension,
          blob,
          folderPath
        });

        const progressVal = Math.round(10 + (step / imagesToZip.length) * 70);
        setProcessingProgress(progressVal);
        step++;
      }

      setProcessingProgress(85);
      const zipBlob = await createBulkZip(zipFiles);
      setProcessingProgress(100);

      const objectUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `PicBatch_Collection_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      // Save dynamic statistics
      db.incrementAnalytics('totalDownloaded', 1);

      onShowNotification('Archive Downloaded', `Assembled and downloaded ${imagesToZip.length} files inside a ZIP.`);
      setSelectedImageIds(new Set());
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate local ZIP file: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform format conversion and compression in batch
  const handleBatchCompressSubmit = async () => {
    setIsProcessing(true);
    setProcessingProgress(5);

    try {
      const selectedImages = savedImages.filter(img => selectedImageIds.has(img.id));
      let index = 1;
      const processedFiles = [];
      let totalSavedBytes = 0;

      for (const img of selectedImages) {
        // We will read the base64, draw it to dynamic canvas, and run compression
        const originalBlob = base64ToBlob(img.base64Data, img.mimeType);
        const tempObjUrl = URL.createObjectURL(originalBlob);

        const compressed = await compressAndConvertImage(
          tempObjUrl,
          compressFormat,
          compressQuality / 100,
          img.filename,
          img.extension,
          index,
          renameTemplate
        );

        URL.revokeObjectURL(tempObjUrl);

        processedFiles.push({
          filename: compressed.filename,
          extension: compressed.extension,
          blob: compressed.blob,
          folderPath: null
        });

        // Compute reduction stats
        const diff = originalBlob.size - compressed.blob.size;
        if (diff > 0) totalSavedBytes += diff;

        // Optionally, save the newly compressed image back to local DB!
        const b64 = await blobToBase64(compressed.blob);
        img.filename = compressed.filename;
        img.extension = compressed.extension;
        img.mimeType = compressed.blob.type;
        img.size = compressed.blob.size;
        img.base64Data = b64;
        img.compressed = true;
        img.compressedRatio = diff > 0 ? (diff / originalBlob.size) : 0;
        await db.saveImage(img);

        const progressVal = Math.round(5 + (index / selectedImages.length) * 80);
        setProcessingProgress(progressVal);
        index++;
      }

      // Generate a zip file containing the newly optimized images
      setProcessingProgress(90);
      const zipBlob = await createBulkZip(processedFiles);
      setProcessingProgress(100);

      const objectUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `PicBatch_Optimized_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      // Increment analytics saved bytes
      if (totalSavedBytes > 0) {
        db.incrementAnalytics('totalCompressedBytes', totalSavedBytes);
      }
      db.incrementAnalytics('totalDownloaded', 1);

      onShowNotification(
        'Batch Optimized!',
        `Successfully converted ${selectedImages.length} images. Saved ${formatBytes(totalSavedBytes)} bandwidth.`
      );
      
      setShowBatchCompress(false);
      setSelectedImageIds(new Set());
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Error during batch optimization: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulated Cloud Sync backup stream
  const handleCloudBackupTrigger = (service: 'googleDrive' | 'dropbox') => {
    const serviceLabel = service === 'googleDrive' ? 'Google Drive' : 'Dropbox';
    
    if (savedImages.length === 0) {
      alert('Nothing to backup! Save some images from the scraper dashboard first.');
      return;
    }

    setIsUploadingBackup(serviceLabel);
    setBackupProgress(5);

    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploadingBackup(null);
            
            // Save last backup timestamp
            const updatedConfig = { ...cloudConfig };
            updatedConfig[service].lastBackup = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setCloudConfig(updatedConfig);
            db.saveCloudConfig(updatedConfig);

            onShowNotification(
              'Backup Successful',
              `Compressed ${savedImages.length} folders and uploaded cleanly to your ${serviceLabel} directory.`
            );
          }, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 250);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="collections-dashboard">
      
      {/* Sidebar: Folders List & Actions */}
      <div className="flex flex-col gap-4">
        {/* Connection status card */}
        <div className={`p-4 rounded-3xl border ${
          onlineStatus 
            ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' 
            : 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30'
        } shadow-2xs`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Storage Sync</span>
            <span className={`h-2.5 w-2.5 rounded-full ${onlineStatus ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`}></span>
          </div>

          {!onlineStatus ? (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <span>Working Offline</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                Modifications are saved locally in the browser storage cache. We will auto-sync once a network connection is established.
              </p>
              {syncLogsCount > 0 && (
                <button 
                  onClick={triggerAutoSync}
                  disabled={isSyncing}
                  className="mt-1 w-full py-1.5 flex items-center justify-center gap-1 text-[10px] font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Force Offline Sync ({syncLogsCount})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col mt-2 gap-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sync Pipeline Online</span>
              <p className="text-[10px] text-slate-400">Your digital assets are safely stored in your sandboxed IndexedDB workspace.</p>
            </div>
          )}
        </div>

        {/* Cloud Backups Area */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-4 shadow-2xs flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cloud Operations</span>
          
          <div className="flex flex-col gap-2">
            {/* Google Drive backup */}
            <button
              onClick={() => handleCloudBackupTrigger('googleDrive')}
              disabled={!cloudConfig.googleDrive.connected || isUploadingBackup !== null}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                cloudConfig.googleDrive.connected 
                  ? 'bg-blue-50/50 hover:bg-blue-100/60 dark:bg-blue-950/10 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 cursor-pointer' 
                  : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                <span>Google Drive</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {cloudConfig.googleDrive.connected 
                  ? cloudConfig.googleDrive.lastBackup ? `Synced ${cloudConfig.googleDrive.lastBackup}` : 'Click Backup'
                  : 'Disconnected'
                }
              </span>
            </button>

            {/* Dropbox backup */}
            <button
              onClick={() => handleCloudBackupTrigger('dropbox')}
              disabled={!cloudConfig.dropbox.connected || isUploadingBackup !== null}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                cloudConfig.dropbox.connected 
                  ? 'bg-indigo-50/50 hover:bg-indigo-100/60 dark:bg-indigo-950/10 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 cursor-pointer' 
                  : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                <span>Dropbox Sync</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {cloudConfig.dropbox.connected 
                  ? cloudConfig.dropbox.lastBackup ? `Synced ${cloudConfig.dropbox.lastBackup}` : 'Click Backup'
                  : 'Disconnected'
                }
              </span>
            </button>
          </div>
        </div>

        {/* Folders Management Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subfolders</span>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="p-1 text-brand hover:bg-brand/10 rounded-lg transition-all"
              title="Add New Folder"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {/* Folder: ALL */}
            <button
              onClick={() => { setSelectedFolderId('all'); setSelectedImageIds(new Set()); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedFolderId === 'all'
                  ? 'bg-brand/10 dark:bg-brand/20 text-brand'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>All Assets</span>
              </div>
              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                {savedImages.length}
              </span>
            </button>

            {/* Folder: UNORGANIZED */}
            <button
              onClick={() => { setSelectedFolderId('unorganized'); setSelectedImageIds(new Set()); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedFolderId === 'unorganized'
                  ? 'bg-brand/10 dark:bg-brand/20 text-brand'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>Unorganized Files</span>
              </div>
              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                {savedImages.filter(img => img.folderId === null).length}
              </span>
            </button>

            {/* Custom folders lists */}
            {folders.map(folder => {
              const count = savedImages.filter(img => img.folderId === folder.id).length;
              return (
                <div key={folder.id} className="group flex items-center justify-between rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all pr-1">
                  <button
                    onClick={() => { setSelectedFolderId(folder.id); setSelectedImageIds(new Set()); }}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                      selectedFolderId === folder.id
                        ? 'bg-brand/10 dark:bg-brand/20 text-brand'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="h-4 w-4 shrink-0 text-amber-500/85" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded ml-2">
                      {count}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id, folder.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Folder"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Main Column: Grid of images, filters and batch processing */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        
        {/* Upper Search Bar & Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search saved image collections by filename or format..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs rounded-xl text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-brand font-medium"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSelectAll}
              className="px-3.5 py-2 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {selectedImageIds.size === filteredImages.length && filteredImages.length > 0 ? (
                <>
                  <CheckSquare className="h-4 w-4 text-brand" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  <span>Select All ({filteredImages.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Items Batch Processing Action Bar */}
        {selectedImageIds.size > 0 && (
          <div className="bg-brand text-white rounded-3xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in">
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                {selectedImageIds.size}
              </span>
              <span className="text-xs font-semibold">Image(s) Selected for Batch Action</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setTargetFolderForMove(folders[0]?.id || 'unorganized');
                  setShowBatchMove(true);
                }}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Folder className="h-3.5 w-3.5" />
                <span>Move Folder</span>
              </button>
              <button
                onClick={() => setShowBatchRename(true)}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <FileEdit className="h-3.5 w-3.5" />
                <span>Rename Series</span>
              </button>
              <button
                onClick={() => setShowBatchCompress(true)}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Optimize & Export</span>
              </button>
              <button
                onClick={handleBatchDownloadZIP}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download ZIP</span>
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Grid of Saved Collections */}
        {filteredImages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-full text-slate-400">
              <ImageIcon className="h-10 w-10 stroke-1" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Image Assets Found</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Use the scraper utility to load and extract images from target URLs, then hit "Save to Collection" to populate these storage directories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredImages.map(img => {
              const isSelected = selectedImageIds.has(img.id);
              return (
                <div
                  key={img.id}
                  onClick={() => {
                    toggleSelectImage(img.id);
                    if (activeSizeDropdownId) {
                      setActiveSizeDropdownId(null);
                    }
                  }}
                  className={`group relative bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-brand ring-2 ring-brand/25' 
                      : 'border-slate-100 dark:border-slate-800/80'
                  }`}
                >
                  {/* Select Icon badge */}
                  <div className={`absolute top-3 left-3 z-10 p-1 rounded-full border transition-all ${
                    isSelected 
                      ? 'bg-brand text-white border-brand' 
                      : 'bg-white/80 dark:bg-slate-900/80 text-slate-400 border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100'
                  }`}>
                    <CheckSquare className="h-4.5 w-4.5" />
                  </div>

                  {/* Format Label badge */}
                  <span className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-md bg-slate-950/75 dark:bg-slate-950/85 text-[10px] font-mono font-bold text-white shadow-xs uppercase">
                    {img.extension}
                  </span>

                  {/* Image Display */}
                  <div className="aspect-video w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={img.base64Data}
                      alt={img.filename}
                      referrerPolicy="no-referrer"
                      className="object-contain h-full w-full transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {img.compressed && (
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-emerald-500/90 text-[9px] font-bold text-white uppercase flex items-center gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>Optimized</span>
                      </span>
                    )}
                  </div>

                  {/* Card Info & Details */}
                  <div className="p-3.5 flex flex-col gap-1.5">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-6" title={img.filename}>
                      {img.filename}
                    </h5>

                    <div className="flex items-center justify-between text-[10px] font-mono font-medium text-slate-400">
                      <span>{img.width} × {img.height}</span>
                      <span>{formatBytes(img.size)}</span>
                    </div>

                    {/* Single-item actions tool rail */}
                    <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-1.5 flex items-center justify-end gap-1.5 relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSingleRename(img.id, img.filename, img.extension)}
                        className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10 rounded-lg transition-all"
                        title="Rename file"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setActiveSizeDropdownId(activeSizeDropdownId === img.id ? null : img.id)}
                        className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                          activeSizeDropdownId === img.id 
                            ? 'bg-brand/10 text-brand dark:bg-brand/20' 
                            : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                        title="Download file with custom sizes"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      {/* Size Dropdown Box */}
                      {activeSizeDropdownId === img.id && (
                        <div className="absolute bottom-10 right-0 z-30 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 text-left animate-scale-in">
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

                      <button
                        onClick={() => handleDeleteImage(img.id, img.filename)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                        title="Delete image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AdPlaceholder slot="4920194" format="horizontal" />

      </div>

      {/* MODAL: Create Folder */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Create Subfolder</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Folder Name</label>
              <input
                type="text"
                placeholder="e.g. Logos, Wallpapers, Backgrounds..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 font-semibold"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                className="py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white rounded-xl shadow-md transition-all"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Move Folder */}
      {showBatchMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Move {selectedImageIds.size} File(s)</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Destination Folder</label>
              <select
                value={targetFolderForMove}
                onChange={(e) => setTargetFolderForMove(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 font-semibold"
              >
                <option value="unorganized">Unorganized Files</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setShowBatchMove(false)}
                className="py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchMoveSubmit}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md transition-all"
              >
                Move Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Rename */}
      {showBatchRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Batch Rename Series</h3>
            
            <p className="text-xs text-slate-400 leading-normal">
              Apply a dynamic naming pattern across all {selectedImageIds.size} selected image files:
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rename Template Pattern</label>
              <input
                type="text"
                placeholder="[name]_opt_[index]"
                value={renameTemplate}
                onChange={(e) => setRenameTemplate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 font-mono"
              />
              <div className="grid grid-cols-2 gap-1 text-[9px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg mt-1 border border-slate-100 dark:border-slate-850">
                <div>[name] = Original name</div>
                <div>[index] = Incremental index (001)</div>
                <div>[date] = Current date (YYYY-MM-DD)</div>
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
                onClick={handleBatchRenameSubmit}
                disabled={!renameTemplate.trim()}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white rounded-xl shadow-md transition-all"
              >
                Apply Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Optimization & Export */}
      {showBatchCompress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Batch Compression Settings</h3>
            
            <p className="text-xs text-slate-400 leading-normal">
              Perform format trans-coding and file size compression on {selectedImageIds.size} files in a single batch.
            </p>

            <div className="flex flex-col gap-4">
              {/* Target Format */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Format Conversion</label>
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
                    Lower values save more bandwidth but may introduce visual artifacts. WebP is highly recommended.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setShowBatchCompress(false)}
                className="py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchCompressSubmit}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md transition-all"
              >
                Optimize & Download ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADER OVERLAY: Processing Batch or Backup */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center gap-4 shadow-2xl animate-scale-in">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Processing Batch Operations</h4>
            <p className="text-xs text-slate-400">Drawing pixels, applying compression quality ratios, and packaging.</p>
            
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">{processingProgress}% Complete</span>
          </div>
        </div>
      )}

      {/* LOADER OVERLAY: Simulated Cloud Upload Progress */}
      {isUploadingBackup && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center gap-4 shadow-2xl animate-scale-in">
            <UploadCloud className="h-8 w-8 text-indigo-500 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Syncing Backups to {isUploadingBackup}</h4>
            <p className="text-xs text-slate-400">Compressing local directories into ZIP, transferring to encrypted cloud buckets...</p>
            
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300" 
                style={{ width: `${backupProgress}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">{backupProgress}% Transferred</span>
          </div>
        </div>
      )}

    </div>
  );
}
