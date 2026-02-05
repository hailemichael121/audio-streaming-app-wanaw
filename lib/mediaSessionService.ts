// Media Session API integration for background playback and lock-screen controls

import type { Audio } from "./types";

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
    if (!("mediaSession" in navigator)) return;

    const mediaSession = navigator.mediaSession;

    mediaSession.setActionHandler("play", () => this.callbacks.play());
    mediaSession.setActionHandler("pause", () => this.callbacks.pause());
    mediaSession.setActionHandler("nexttrack", () => this.callbacks.next());
    mediaSession.setActionHandler("previoustrack", () =>
      this.callbacks.previous(),
    );
    mediaSession.setActionHandler("seekto", (event) => {
      if (typeof event.seekTime === "number") {
        this.callbacks.seek(event.seekTime);
      }
    });
  }

  public updateMetadata(audio: Audio) {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: audio.title,
      artist: "Ethiopian Orthodox Church",
      album: `Day ${audio.day}`,
      artwork: [{ src: "/icon.svg", sizes: "512x512", type: "image/svg+xml" }],
    });
  }

  public updatePlaybackState(
    isPlaying: boolean,
    currentTime: number,
    duration: number,
    playbackRate = 1,
  ) {
    if (!("mediaSession" in navigator)) return;

    const mediaSession = navigator.mediaSession;
    mediaSession.playbackState = isPlaying ? "playing" : "paused";

    if (!Number.isFinite(duration) || duration <= 0) return;

    mediaSession.setPositionState({
      duration,
      playbackRate,
      position: Math.max(0, Math.min(currentTime, duration)),
    });
  }

  public destroy() {
    if (!("mediaSession" in navigator)) return;
    const mediaSession = navigator.mediaSession;
    mediaSession.setActionHandler("play", null);
    mediaSession.setActionHandler("pause", null);
    mediaSession.setActionHandler("nexttrack", null);
    mediaSession.setActionHandler("previoustrack", null);
    mediaSession.setActionHandler("seekto", null);
  }
}

export function requestWakeLock() {
  if ("wakeLock" in navigator) {
    (
      navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<unknown> };
      }
    ).wakeLock
      ?.request("screen")
      .catch(() => undefined);
  }
}

export function releaseWakeLock() {
  if ("wakeLock" in navigator) {
    (
      navigator as Navigator & {
        wakeLock?: { release?: () => Promise<unknown> };
      }
    ).wakeLock?.release?.();
  }
}
