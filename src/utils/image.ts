/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';

// Load image into an HTMLImageElement
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS handling
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image element'));
  });
}

// Fetch image blob size and dimensions using proxy url
export async function getImageMetadata(proxyUrl: string): Promise<{ width: number; height: number; size: number }> {
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Network response failed');
    const blob = await response.blob();
    const size = blob.size;

    // Load image to get width and height
    const objectUrl = URL.createObjectURL(blob);
    const img = await loadImage(objectUrl);
    const width = img.width;
    const height = img.height;
    
    URL.revokeObjectURL(objectUrl);

    return { width, height, size };
  } catch (error) {
    console.error('Error fetching image metadata:', error);
    return { width: 0, height: 0, size: 0 };
  }
}

// Format bytes to human readable format
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Parse renaming templates
export function parseNamingTemplate(
  template: string,
  originalName: string,
  index: number,
  extension: string,
  width?: number,
  height?: number
): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const indexStr = String(index).padStart(3, '0');
  
  let result = template
    .replace(/\[name\]/g, originalName)
    .replace(/\[index\]/g, indexStr)
    .replace(/\[date\]/g, dateStr)
    .replace(/\[width\]/g, width ? String(width) : '')
    .replace(/\[height\]/g, height ? String(height) : '');

  // fallback if empty
  if (!result.trim()) {
    result = `${originalName}_${indexStr}`;
  }

  return `${result}.${extension}`;
}

// Convert format and compress image
export async function compressAndConvertImage(
  proxyUrl: string,
  targetFormat: 'original' | 'jpeg' | 'png' | 'webp',
  quality: number, // 0.1 to 1.0
  originalFilename: string,
  originalExtension: string,
  index: number,
  renameTemplate?: string
): Promise<{
  blob: Blob;
  filename: string;
  extension: string;
  size: number;
  width: number;
  height: number;
}> {
  // 1. Fetch image blob
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const originalBlob = await response.blob();
  
  const objectUrl = URL.createObjectURL(originalBlob);
  const img = await loadImage(objectUrl);
  const width = img.width;
  const height = img.height;

  // Determine output format & extension
  let formatMime = originalBlob.type;
  let extension = originalExtension;

  if (targetFormat !== 'original') {
    extension = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
    formatMime = `image/${targetFormat}`;
  }

  // 2. Perform canvas drawing and compression
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // Handle transparent background for JPEG conversion (fill with white)
  if (formatMime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Export compressed image as Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (compressedBlob) => {
        URL.revokeObjectURL(objectUrl);
        if (!compressedBlob) {
          reject(new Error('Canvas export to blob failed'));
          return;
        }

        // Apply custom naming template if provided
        let finalFilename = originalFilename;
        if (renameTemplate) {
          const templatedName = parseNamingTemplate(renameTemplate, originalFilename, index, extension, width, height);
          finalFilename = templatedName.endsWith(`.${extension}`) 
            ? templatedName.substring(0, templatedName.lastIndexOf(`.${extension}`)) 
            : templatedName;
        }

        resolve({
          blob: compressedBlob,
          filename: finalFilename,
          extension,
          size: compressedBlob.size,
          width,
          height,
        });
      },
      formatMime,
      quality
    );
  });
}

// Convert image Blob to Base64 String (for offline db persistence)
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert Base64 String back to Blob
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

// Create ZIP file with folders hierarchy
export async function createBulkZip(
  files: { filename: string; extension: string; blob: Blob; folderPath: string | null }[]
): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    const fullFilename = `${file.filename}.${file.extension}`;
    if (file.folderPath) {
      const folder = zip.folder(file.folderPath);
      if (folder) {
        folder.file(fullFilename, file.blob);
      }
    } else {
      zip.file(fullFilename, file.blob);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Resize and download a single image on-the-fly.
 * Works with both direct HTTP/proxy URLs and Base64 strings.
 */
export async function downloadImageWithSize(
  sourceUrlOrBase64: string,
  filename: string,
  extension: string,
  mimeType: string,
  targetSize: 'original' | 'large' | 'medium' | 'small' | 'thumbnail',
  originalWidth = 0,
  originalHeight = 0
): Promise<void> {
  let blob: Blob;

  if (sourceUrlOrBase64.startsWith('data:')) {
    blob = base64ToBlob(sourceUrlOrBase64, mimeType);
  } else {
    const response = await fetch(sourceUrlOrBase64);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    blob = await response.blob();
  }

  let finalBlob = blob;
  let finalWidth = originalWidth;
  let finalHeight = originalHeight;

  // Resolve original dimensions if not passed
  if (targetSize !== 'original' || originalWidth === 0 || originalHeight === 0) {
    const objectUrlForDimensions = URL.createObjectURL(blob);
    try {
      const tempImg = await loadImage(objectUrlForDimensions);
      finalWidth = tempImg.width;
      finalHeight = tempImg.height;
    } catch (e) {
      console.warn("Could not load image to determine original dimensions.", e);
    } finally {
      URL.revokeObjectURL(objectUrlForDimensions);
    }
  }

  // Size constraints
  let maxDim = 0;
  if (targetSize === 'large') maxDim = 1920;
  else if (targetSize === 'medium') maxDim = 1200;
  else if (targetSize === 'small') maxDim = 800;
  else if (targetSize === 'thumbnail') maxDim = 400;

  if (maxDim > 0 && finalWidth > 0 && finalHeight > 0) {
    // Calculate aspect ratio
    const ratio = Math.min(maxDim / finalWidth, maxDim / finalHeight);
    if (ratio < 1) {
      const targetW = Math.round(finalWidth * ratio);
      const targetH = Math.round(finalHeight * ratio);

      const objectUrl = URL.createObjectURL(blob);
      const img = await loadImage(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D context');

      const finalMime = mimeType || 'image/jpeg';
      if (finalMime === 'image/jpeg' || finalMime === 'image/jpg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);

      finalBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            URL.revokeObjectURL(objectUrl);
            if (!b) {
              reject(new Error('Resize blob creation failed'));
            } else {
              resolve(b);
            }
          },
          finalMime,
          0.9
        );
      });
    }
  }

  // Handle download trigger in browser
  const downloadUrl = URL.createObjectURL(finalBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  
  // Format the name with size suffix if not original
  const suffix = targetSize !== 'original' ? `_${targetSize}` : '';
  const cleanExtension = extension === 'jpeg' ? 'jpg' : extension;
  link.download = `${filename}${suffix}.${cleanExtension}`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
