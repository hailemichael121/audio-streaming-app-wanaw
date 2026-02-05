'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { downloadMonth, getOfflineStorage, clearAllOfflineAudios } from '@/lib/offlineService';
import { getMonths, getPartsForMonth } from '@/lib/audioDataService';
import type { Audio } from '@/lib/types';

interface DownloadItem {
  monthNumber: number;
  monthName: string;
  audioCount: number;
  isDownloading: boolean;
  progress: number;
}

const MONTHS = getMonths();

// Collect all songs from a month's parts (from month constants)
function getAudiosForMonth(monthNumber: number): Audio[] {
  const parts = getPartsForMonth(monthNumber);
  const audios: Audio[] = [];
  for (const part of parts) {
    audios.push(...part.songs);
  }
  return audios;
}

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<DownloadItem[]>(
    MONTHS.map((m) => ({
      monthNumber: m.number,
      monthName: m.name,
      audioCount: 0,
      isDownloading: false,
      progress: 0,
    }))
  );

  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, fileCount: 0 });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    updateStorageInfo();
  }, []);

  const updateStorageInfo = async () => {
    const info = await getOfflineStorage();
    setStorageInfo(info);
  };

  const handleDownloadMonth = async (monthNumber: number) => {
    setDownloads((prev) =>
      prev.map((d) =>
        d.monthNumber === monthNumber
          ? { ...d, isDownloading: true, progress: 0 }
          : d
      )
    );

    try {
      const audios = getAudiosForMonth(monthNumber);
      await downloadMonth(monthNumber, audios, (audioId, progress) => {
        setDownloads((prev) =>
          prev.map((d) =>
            d.monthNumber === monthNumber
              ? { ...d, progress: Math.max(d.progress, progress) }
              : d
          )
        );
      });

      setDownloads((prev) =>
        prev.map((d) =>
          d.monthNumber === monthNumber
            ? { ...d, isDownloading: false, progress: 100, audioCount: audios.length }
            : d
        )
      );

      updateStorageInfo();
    } catch (error) {
      console.error('[v0] Download error:', error);
      setDownloads((prev) =>
        prev.map((d) =>
          d.monthNumber === monthNumber
            ? { ...d, isDownloading: false, progress: 0 }
            : d
        )
      );
    }
  };

  const handleClearStorage = async () => {
    try {
      await clearAllOfflineAudios();
      setDownloads((prev) =>
        prev.map((d) => ({
          ...d,
          audioCount: 0,
          progress: 0,
        }))
      );
      updateStorageInfo();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('[v0] Error clearing storage:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <main className="min-h-svh bg-background text-foreground pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 shadow-sm flex items-center gap-3">
        <Link href="/" className="active:opacity-70">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Offline Downloads</h1>
          <p className="text-xs opacity-90">Download months for offline access</p>
        </div>
      </header>

      {/* Storage Info */}
      <div className="p-4 bg-card border-b border-border">
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
            <p className="text-sm font-semibold text-card-foreground">
              {formatBytes(storageInfo.totalSize)}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {storageInfo.fileCount} audios downloaded
          </div>
          {storageInfo.fileCount > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="mt-3 text-xs text-accent hover:text-accent/80 transition-colors active:opacity-70 font-medium"
            >
              Clear all downloads
            </button>
          )}
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-card border-t border-border rounded-t-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-card-foreground">Clear all downloads?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will delete {storageInfo.fileCount} offline audios. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 bg-muted rounded-lg text-card-foreground font-medium active:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={handleClearStorage}
                className="flex-1 px-4 py-2 bg-destructive rounded-lg text-destructive-foreground font-medium active:opacity-70"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downloads List */}
      <div className="divide-y divide-border">
        {downloads.map((download) => (
          <button
            key={download.monthNumber}
            onClick={() =>
              !download.isDownloading && download.audioCount === 0
                ? handleDownloadMonth(download.monthNumber)
                : null
            }
            disabled={download.isDownloading}
            className="w-full text-left p-4 active:bg-muted transition-colors disabled:opacity-50 flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground">
                {download.monthName}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {download.audioCount > 0
                  ? `${download.audioCount} audios downloaded`
                  : 'Not downloaded'}
              </p>
              {download.isDownloading && (
                <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${download.progress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex-shrink-0 text-accent">
              {download.isDownloading ? (
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : download.audioCount > 0 ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
