// Media Session API integration for background playback and lock-screen controls
// This handles lock-screen media controls and background playback on mobile devices

import type { Audio } from './types';

export interface MediaSessionCallbacks {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
}

export class MediaSessionManager {
  private callbacks: MediaSessionCallbacks;

  constructor(callbacks: MediaSessionCallbacks) {
    this.callbacks = callbacks;
    this.setupMediaSession();
  }

  private setupMediaSession() {
    if (!('mediaSession' in navigator)) {
      console.log('[v0] Media Session API not supported');
      return;
    }

    const mediaSession = navigator.mediaSession;

    // Set action handlers
    mediaSession.setActionHandler('play', () => {
      this.callbacks.play();
    });

    mediaSession.setActionHandler('pause', () => {
      this.callbacks.pause();
    });

    mediaSession.setActionHandler('nexttrack', () => {
      this.callbacks.next();
    });

    mediaSession.setActionHandler('previoustrack', () => {
      this.callbacks.previous();
    });

    mediaSession.setActionHandler('seekto', (event) => {
      if (event.seekTime) {
        this.callbacks.seek(event.seekTime);
      }
    });

    console.log('[v0] Media Session API initialized');
  }

  public updateMetadata(audio: Audio) {
    if (!('mediaSession' in navigator)) return;

    const mediaSession = navigator.mediaSession;

    mediaSession.metadata = new MediaMetadata({
      title: audio.title,
      artist: 'Ethiopian Orthodox Church',
      album: `Day ${audio.day}`,
      artwork: [
        {
          src: '/icon.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
        },
      ],
    });

    console.log('[v0] Media session metadata updated:', audio.title);
  }

  public updatePlaybackState(isPlaying: boolean, currentTime: number, duration: number) {
    if (!('mediaSession' in navigator)) return;

    const mediaSession = navigator.mediaSession;

    mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position: currentTime,
    });
  }

  public destroy() {
    if (!('mediaSession' in navigator)) return;

    const mediaSession = navigator.mediaSession;
    mediaSession.setActionHandler('play', null);
    mediaSession.setActionHandler('pause', null);
    mediaSession.setActionHandler('nexttrack', null);
    mediaSession.setActionHandler('previoustrack', null);
    mediaSession.setActionHandler('seekto', null);
  }
}

// Lock screen and notification helpers for mobile
export function requestWakeLock() {
  if ('wakeLock' in navigator) {
    (navigator as any).wakeLock
      .request('screen')
      .then(() => {
        console.log('[v0] Wake lock acquired');
      })
      .catch((err: Error) => {
        console.log('[v0] Wake lock error:', err);
      });
  }
}

export function releaseWakeLock() {
  if ('wakeLock' in navigator) {
    (navigator as any).wakeLock.release?.();
  }
}

// Background sync for downloads (Capacitor integration point)
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-downloads');
      console.log('[v0] Background sync registered');
    } catch (err) {
      console.log('[v0] Background sync not available:', err);
    }
  }
}
