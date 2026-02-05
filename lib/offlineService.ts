// Service for managing offline file downloads
// Uses Capacitor Filesystem API in production, localStorage for web fallback

import type { Audio, OfflineFile, DownloadProgress } from './types';

const DB_NAME = 'EthiopianOrthodoxMusic';
const STORE_NAME = 'offlineFiles';

// Initialize IndexedDB for storing offline files metadata
let db: IDBDatabase;

export async function initializeDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'audioId' });
      }
    };
  });
}

/** Use proxy for cross-origin URLs to avoid CORS (browser only) */
function getFetchUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const u = new URL(url);
      if (u.origin !== window.location.origin) {
        return `${window.location.origin}/api/audio/proxy?url=${encodeURIComponent(url)}`;
      }
    }
  } catch {
    // ignore
  }
  return url;
}

export async function downloadAudio(
  audio: Audio,
  onProgress: (progress: number) => void
): Promise<OfflineFile> {
  try {
    console.log('[v0] Starting download for audio:', audio.id);

    const fetchUrl = getFetchUrl(audio.url);
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = parseInt(contentLength || '0', 10);
    let loaded = 0;

    // Read the blob
    const blob = await response.blob();
    loaded = blob.size;

    // Update progress
    if (total > 0) {
      onProgress(Math.round((loaded / total) * 100));
    }

    // Store in IndexedDB
    const localPath = `offline_${audio.id}_${Date.now()}.mp3`;
    const offlineFile: OfflineFile = {
      audioId: audio.id,
      filename: audio.filename,
      localPath,
      size: blob.size,
      downloadedAt: Date.now(),
    };

    // Store blob in IndexedDB
    await saveToIndexedDB(offlineFile, blob);

    // Store as object URL for quick access
    const objectUrl = URL.createObjectURL(blob);
    localStorage.setItem(`${audio.id}_url`, objectUrl);
    localStorage.setItem(`${audio.id}_size`, blob.size.toString());

    onProgress(100);
    console.log('[v0] Download completed for audio:', audio.id);

    return offlineFile;
  } catch (error) {
    console.error('[v0] Download error:', error);
    throw error;
  }
}

export async function downloadMonth(
  month: number,
  audios: Audio[],
  onProgress: (audioId: string, progress: number) => void
): Promise<OfflineFile[]> {
  const offlineFiles: OfflineFile[] = [];

  for (const audio of audios) {
    try {
      const offlineFile = await downloadAudio(audio, (progress) => {
        onProgress(audio.id, progress);
      });
      offlineFiles.push(offlineFile);
    } catch (error) {
      console.error('[v0] Failed to download audio:', audio.id, error);
      // Continue with next audio
    }
  }

  return offlineFiles;
}

export async function getOfflineAudio(audioId: string): Promise<Blob | null> {
  try {
    // Try to get object URL from localStorage
    const objectUrl = localStorage.getItem(`${audioId}_url`);
    if (objectUrl) {
      return null; // URL is ready to use
    }

    // Try to get from IndexedDB
    const blob = await getFromIndexedDB(audioId);
    if (blob) {
      const url = URL.createObjectURL(blob);
      localStorage.setItem(`${audioId}_url`, url);
      return blob;
    }

    return null;
  } catch (error) {
    console.error('[v0] Error retrieving offline audio:', error);
    return null;
  }
}

export async function deleteOfflineAudio(audioId: string): Promise<void> {
  try {
    // Delete from IndexedDB
    await deleteFromIndexedDB(audioId);

    // Revoke object URL and remove from localStorage
    const objectUrl = localStorage.getItem(`${audioId}_url`);
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      localStorage.removeItem(`${audioId}_url`);
      localStorage.removeItem(`${audioId}_size`);
    }

    console.log('[v0] Deleted offline audio:', audioId);
  } catch (error) {
    console.error('[v0] Error deleting offline audio:', error);
  }
}

export async function getOfflineStorage(): Promise<{
  totalSize: number;
  fileCount: number;
}> {
  try {
    if (!db) {
      await initializeDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const files = request.result as OfflineFile[];
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        resolve({
          totalSize,
          fileCount: files.length,
        });
      };
    });
  } catch (error) {
    console.error('[v0] Error getting offline storage info:', error);
    return { totalSize: 0, fileCount: 0 };
  }
}

export async function clearAllOfflineAudios(): Promise<void> {
  try {
    if (!db) {
      await initializeDB();
    }

    // Clear IndexedDB
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Clear localStorage entries
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.endsWith('_url') || key.endsWith('_size')) {
            const url = localStorage.getItem(key);
            if (url && key.endsWith('_url')) {
              URL.revokeObjectURL(url);
            }
            localStorage.removeItem(key);
          }
        });

        console.log('[v0] Cleared all offline audios');
        resolve();
      };
    });
  } catch (error) {
    console.error('[v0] Error clearing offline audios:', error);
  }
}

// Helper functions for IndexedDB
async function saveToIndexedDB(offlineFile: OfflineFile, blob: Blob): Promise<void> {
  if (!db) {
    await initializeDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({
      ...offlineFile,
      blob, // Store blob directly
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getFromIndexedDB(audioId: string): Promise<Blob | null> {
  if (!db) {
    await initializeDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(audioId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const file = request.result;
      resolve(file?.blob || null);
    };
  });
}

async function deleteFromIndexedDB(audioId: string): Promise<void> {
  if (!db) {
    await initializeDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(audioId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
