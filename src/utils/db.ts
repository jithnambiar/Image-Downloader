/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImageFolder, SavedImage, CloudStorageConfig, AnalyticsStats, SyncLog, UserProfile } from '../types';

// Helper to check if online
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

class LocalDatabase {
  private useLocalStorageFallback = false;

  constructor() {
    this.testIndexedDB();
  }

  private testIndexedDB() {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        this.useLocalStorageFallback = true;
        return;
      }
    } catch (e) {
      this.useLocalStorageFallback = true;
    }
  }

  // --- Generic LocalStorage Fallbacks ---
  private getFallback<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  private setFallback<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`LocalStorage error writing key ${key}:`, e);
    }
  }

  // --- Folder Operations ---
  public async getFolders(): Promise<ImageFolder[]> {
    if (this.useLocalStorageFallback) {
      return this.getFallback<ImageFolder[]>('img_downloader_folders', []);
    }
    return new Promise((resolve) => {
      const request = indexedDB.open('ImageDownloaderDB', 1);
      request.onerror = () => resolve(this.getFallback<ImageFolder[]>('img_downloader_folders', []));
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('folders')) {
          resolve([]);
          return;
        }
        const transaction = db.transaction('folders', 'readonly');
        const store = transaction.objectStore('folders');
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = () => resolve([]);
      };
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('folders')) db.createObjectStore('folders', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'id' });
      };
    });
  }

  public async saveFolder(folder: ImageFolder): Promise<void> {
    const folders = await this.getFolders();
    const exists = folders.findIndex(f => f.id === folder.id);
    if (exists > -1) {
      folders[exists] = folder;
    } else {
      folders.push(folder);
    }
    this.setFallback('img_downloader_folders', folders);

    if (!this.useLocalStorageFallback) {
      await this.writeToStore('folders', folder);
    }
  }

  public async deleteFolder(folderId: string): Promise<void> {
    // 1. Delete folder
    const folders = await this.getFolders();
    this.setFallback('img_downloader_folders', folders.filter(f => f.id !== folderId));

    if (!this.useLocalStorageFallback) {
      await this.deleteFromStore('folders', folderId);
    }

    // 2. Re-organize files inside folder to unorganized (null)
    const images = await this.getSavedImages();
    for (const image of images) {
      if (image.folderId === folderId) {
        image.folderId = null;
        await this.saveImage(image);
      }
    }
  }

  // --- Image Operations ---
  public async getSavedImages(): Promise<SavedImage[]> {
    if (this.useLocalStorageFallback) {
      return this.getFallback<SavedImage[]>('img_downloader_images', []);
    }
    return new Promise((resolve) => {
      const request = indexedDB.open('ImageDownloaderDB', 1);
      request.onerror = () => resolve(this.getFallback<SavedImage[]>('img_downloader_images', []));
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('images')) {
          resolve([]);
          return;
        }
        const transaction = db.transaction('images', 'readonly');
        const store = transaction.objectStore('images');
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = () => resolve([]);
      };
    });
  }

  public async saveImage(image: SavedImage): Promise<void> {
    const images = await this.getSavedImages();
    const exists = images.findIndex(img => img.id === image.id);
    if (exists > -1) {
      images[exists] = image;
    } else {
      images.push(image);
    }
    this.setFallback('img_downloader_images', images);

    if (!this.useLocalStorageFallback) {
      await this.writeToStore('images', image);
    }
  }

  public async deleteImage(imageId: string): Promise<void> {
    const images = await this.getSavedImages();
    this.setFallback('img_downloader_images', images.filter(img => img.id !== imageId));

    if (!this.useLocalStorageFallback) {
      await this.deleteFromStore('images', imageId);
    }
  }

  // --- Cloud storage config ---
  public getCloudConfig(): CloudStorageConfig {
    return this.getFallback<CloudStorageConfig>('img_downloader_cloud', {
      googleDrive: { connected: false, email: null, lastBackup: null, autoBackup: false },
      dropbox: { connected: false, email: null, lastBackup: null, autoBackup: false },
    });
  }

  public saveCloudConfig(config: CloudStorageConfig): void {
    this.setFallback('img_downloader_cloud', config);
  }

  // --- User Profile ---
  public getUserProfile(): UserProfile {
    return this.getFallback<UserProfile>('img_downloader_profile', {
      email: 'user@example.com',
      twoFactorEnabled: false,
      offlineMode: false,
    });
  }

  public saveUserProfile(profile: UserProfile): void {
    this.setFallback('img_downloader_profile', profile);
  }

  // --- Analytics Stats ---
  public getAnalytics(): AnalyticsStats {
    return this.getFallback<AnalyticsStats>('img_downloader_analytics', {
      totalScraped: 0,
      totalDownloaded: 0,
      totalCompressedBytes: 0,
      totalSaves: 0,
      formatDistribution: { png: 0, jpeg: 0, webp: 0, svg: 0, gif: 0 },
    });
  }

  public saveAnalytics(stats: AnalyticsStats): void {
    this.setFallback('img_downloader_analytics', stats);
  }

  public incrementAnalytics(field: keyof Omit<AnalyticsStats, 'formatDistribution'>, amount = 1): void {
    const stats = this.getAnalytics();
    (stats[field] as number) += amount;
    this.saveAnalytics(stats);
  }

  public incrementFormatDistribution(format: string): void {
    const stats = this.getAnalytics();
    const fmt = format.toLowerCase();
    stats.formatDistribution[fmt] = (stats.formatDistribution[fmt] || 0) + 1;
    this.saveAnalytics(stats);
  }

  // --- Sync Logs (for offline state) ---
  public getSyncLogs(): SyncLog[] {
    return this.getFallback<SyncLog[]>('img_downloader_sync_logs', []);
  }

  public saveSyncLogs(logs: SyncLog[]): void {
    this.setFallback('img_downloader_sync_logs', logs);
  }

  public async addSyncLog(action: SyncLog['action'], targetId: string, data: any): Promise<void> {
    const logs = this.getSyncLogs();
    const newLog: SyncLog = {
      id: Math.random().toString(36).substring(2, 11),
      action,
      targetId,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    logs.push(newLog);
    this.saveSyncLogs(logs);

    // If online, immediately try to sync
    if (isOnline()) {
      await this.syncPendingLogs();
    }
  }

  public async syncPendingLogs(): Promise<number> {
    const logs = this.getSyncLogs();
    const pending = logs.filter(l => l.status === 'pending');
    if (pending.length === 0) return 0;

    // Simulate synchronization with cloud server
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedLogs = logs.map(l => ({ ...l, status: 'synced' as const }));
        this.saveSyncLogs(updatedLogs);
        resolve(pending.length);
      }, 800);
    });
  }

  // --- IndexedDB Core Operations helper ---
  private writeToStore(storeName: string, item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ImageDownloaderDB', 1);
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const putRequest = store.put(item);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e: any) => reject(e);
      };
      request.onerror = (e: any) => reject(e);
    });
  }

  private deleteFromStore(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ImageDownloaderDB', 1);
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const delRequest = store.delete(key);
        delRequest.onsuccess = () => resolve();
        delRequest.onerror = (e: any) => reject(e);
      };
      request.onerror = (e: any) => reject(e);
    });
  }
}

export const db = new LocalDatabase();
