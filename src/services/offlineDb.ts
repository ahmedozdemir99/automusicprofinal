import { DownloadRecord, MediaItem } from '../types/media';

const DB_NAME = 'AutoMusicProArchiveDB';
const DB_VERSION = 1;
const STORE_AUDIO = 'audio_archive';

interface StoredAudioEntry {
  contentId: string;
  item: MediaItem;
  blob: Blob;
  sizeBytes: number;
  savedAt: number;
  mimeType: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'contentId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Arşiv veritabanı açılamadı.'));
  });
}

export async function hasOfflineAudio(contentId: string): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readonly');
    const store = tx.objectStore(STORE_AUDIO);
    const req = store.getKey(contentId);
    req.onsuccess = () => resolve(req.result !== undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineAudioBlob(contentId: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readonly');
    const store = tx.objectStore(STORE_AUDIO);
    const req = store.get(contentId);
    req.onsuccess = () => {
      const entry = req.result as StoredAudioEntry | undefined;
      resolve(entry ? entry.blob : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveOfflineAudio(item: MediaItem, blob: Blob): Promise<DownloadRecord> {
  const db = await openDb();
  const entry: StoredAudioEntry = {
    contentId: item.contentId,
    item,
    blob,
    sizeBytes: blob.size,
    savedAt: Date.now(),
    mimeType: blob.type || 'audio/mpeg',
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    const store = tx.objectStore(STORE_AUDIO);
    const req = store.put(entry);
    req.onsuccess = () => {
      resolve({
        contentId: entry.contentId,
        item: entry.item,
        sizeBytes: entry.sizeBytes,
        savedAt: entry.savedAt,
        mimeType: entry.mimeType,
      });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listOfflineRecords(): Promise<DownloadRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readonly');
    const store = tx.objectStore(STORE_AUDIO);
    const req = store.getAll();
    req.onsuccess = () => {
      const entries = (req.result as StoredAudioEntry[]) || [];
      const records: DownloadRecord[] = entries
        .map((e) => ({
          contentId: e.contentId,
          item: e.item,
          sizeBytes: e.sizeBytes,
          savedAt: e.savedAt,
          mimeType: e.mimeType,
        }))
        .sort((a, b) => b.savedAt - a.savedAt);
      resolve(records);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOfflineAudio(contentId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    const store = tx.objectStore(STORE_AUDIO);
    const req = store.delete(contentId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllOfflineAudio(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    const store = tx.objectStore(STORE_AUDIO);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export interface DeviceStorageEstimate {
  archiveUsedBytes: number;
  deviceQuotaBytes: number | null;
  deviceUsageBytes: number | null;
  estimatedFreeGb: number | null;
  isBelowTwoGbThreshold: boolean;
}

export async function getStorageEstimate(records: DownloadRecord[], minFreeSpaceGb = 2): Promise<DeviceStorageEstimate> {
  const archiveUsedBytes = records.reduce((sum, r) => sum + r.sizeBytes, 0);
  if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function') {
    try {
      const est = await navigator.storage.estimate();
      const quota = typeof est.quota === 'number' ? est.quota : null;
      const usage = typeof est.usage === 'number' ? est.usage : null;
      if (quota !== null && usage !== null) {
        const freeBytes = Math.max(0, quota - usage);
        const estimatedFreeGb = freeBytes / (1024 ** 3);
        return {
          archiveUsedBytes,
          deviceQuotaBytes: quota,
          deviceUsageBytes: usage,
          estimatedFreeGb,
          isBelowTwoGbThreshold: estimatedFreeGb < minFreeSpaceGb,
        };
      }
    } catch {
      // Fallback safely when browser restricts StorageManager API
    }
  }
  return {
    archiveUsedBytes,
    deviceQuotaBytes: null,
    deviceUsageBytes: null,
    estimatedFreeGb: null,
    isBelowTwoGbThreshold: false,
  };
}

export function formatBytesGb(bytes: number): string {
  const gb = bytes / (1024 ** 3);
  if (gb >= 0.1) {
    return `${gb.toFixed(2)} GB`;
  }
  const mb = bytes / (1024 ** 2);
  if (mb >= 0.1) {
    return `${mb.toFixed(1)} MB (${gb.toFixed(3)} GB)`;
  }
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}
