/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScrapedImage {
  id: string;
  url: string; // Original URL
  proxyUrl: string; // Server proxy URL for CORS-free downloads
  filename: string;
  extension: string;
  width: number;
  height: number;
  size: number; // in bytes
  mimeType: string;
  selected?: boolean;
}

export interface ImageFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface SavedImage {
  id: string;
  filename: string;
  extension: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  folderId: string | null; // null means unorganized
  base64Data: string; // For offline storage
  originalUrl: string;
  savedAt: string;
  compressed?: boolean;
  compressedRatio?: number;
}

export interface CloudStorageConfig {
  googleDrive: {
    connected: boolean;
    email: string | null;
    lastBackup: string | null;
    autoBackup: boolean;
  };
  dropbox: {
    connected: boolean;
    email: string | null;
    lastBackup: string | null;
    autoBackup: boolean;
  };
}

export interface AnalyticsStats {
  totalScraped: number;
  totalDownloaded: number;
  totalCompressedBytes: number; // bytes saved
  totalSaves: number;
  formatDistribution: { [key: string]: number };
}

export interface SyncLog {
  id: string;
  action: 'create_folder' | 'delete_folder' | 'save_image' | 'delete_image' | 'rename_image';
  targetId: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'synced';
}

export interface UserProfile {
  email: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  offlineMode: boolean;
  theme?: 'blue' | 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';
}
