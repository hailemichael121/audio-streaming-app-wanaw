'use client';

import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import type { Audio, PlayerState, AudioPlayerContextType } from './types';
import { MediaSessionManager, requestWakeLock, releaseWakeLock } from './mediaSessionService';

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSessionRef = useRef<MediaSessionManager | null>(null);
  const [state, setState] = useState<PlayerState>({
    currentAudio: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isOfflineMode: false,
  });

  // Initialize audio element and media session
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
      audioRef.current.crossOrigin = 'anonymous';
      
      // Initialize media session for lock-screen controls
      mediaSessionRef.current = new MediaSessionManager({
        play: () => audioRef.current?.play(),
        pause: () => audioRef.current?.pause(),
        next: () => {
          // Implemented in next() function below
        },
        previous: () => {
          // Implemented in previous() function below
        },
        seek: (time: number) => {
          if (audioRef.current) {
            audioRef.current.currentTime = time;
          }
        },
      });
    }

    return () => {
      mediaSessionRef.current?.destroy();
    };
  }, []);

  // Update current time
  useEffect(() => {
    if (!audioRef.current) return;

    const updateTime = () => {
      setState((prev) => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
      }));
    };

    const updateDuration = () => {
      setState((prev) => ({
        ...prev,
        duration: audioRef.current?.duration || 0,
      }));
    };

    const handleEnded = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
      }));
    };

    const audio = audioRef.current;
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  /** Use proxy for cross-origin URLs to avoid CORS */
  const getPlayableUrl = useCallback((rawUrl: string) => {
    if (typeof window === 'undefined') return rawUrl;
    try {
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        const u = new URL(rawUrl);
        if (u.origin !== window.location.origin) {
          return `/api/audio/proxy?url=${encodeURIComponent(rawUrl)}`;
        }
      }
    } catch {
      // ignore
    }
    return rawUrl;
  }, []);

  const play = useCallback((audio: Audio) => {
    if (!audioRef.current) return;

    const rawUrl = audio.localPath || audio.url;
    const url = getPlayableUrl(rawUrl);
    console.log('[v0] Loading audio:', url);

    setState((prev) => ({
      ...prev,
      currentAudio: audio,
      isPlaying: true,
      isLoading: true,
    }));

    audioRef.current.src = url;

    const clearLoading = () => {
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    const handleCanPlay = () => {
      clearLoading();
      audioRef.current?.removeEventListener('error', handleError);
    };

    const handleError = () => {
      const errorCode = audioRef.current?.error?.code;
      const errorMessage = audioRef.current?.error?.message;
      console.error('[v0] Audio error code:', errorCode, 'message:', errorMessage);
      clearLoading();
      audioRef.current?.removeEventListener('canplay', handleCanPlay);
    };

    audioRef.current.addEventListener('canplay', handleCanPlay, { once: true });
    audioRef.current.addEventListener('error', handleError, { once: true });

    audioRef.current.play().catch((error) => {
      console.error('[v0] Failed to play audio:', error.message);
      clearLoading();
    });

    // Update media session metadata
    mediaSessionRef.current?.updateMetadata(audio);
    requestWakeLock();
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setState((prev) => ({
      ...prev,
      isPlaying: false,
    }));

    // Update media session state
    mediaSessionRef.current?.updatePlaybackState(false, audioRef.current?.currentTime || 0, audioRef.current?.duration || 0);
    releaseWakeLock();
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('[v0] Failed to resume audio:', error);
      });
    }
    setState((prev) => ({
      ...prev,
      isPlaying: true,
    }));
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setState((prev) => ({
      ...prev,
      currentTime: time,
    }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    setState((prev) => ({
      ...prev,
      volume: clampedVolume,
    }));
  }, []);

  const next = useCallback((audios: Audio[]) => {
    if (!state.currentAudio || audios.length === 0) return;

    const currentIndex = audios.findIndex((a) => a.id === state.currentAudio?.id);
    const nextIndex = (currentIndex + 1) % audios.length;
    play(audios[nextIndex]);
  }, [state.currentAudio, play]);

  const previous = useCallback((audios: Audio[]) => {
    if (!state.currentAudio || audios.length === 0) return;

    const currentIndex = audios.findIndex((a) => a.id === state.currentAudio?.id);
    const prevIndex = currentIndex === 0 ? audios.length - 1 : currentIndex - 1;
    play(audios[prevIndex]);
  }, [state.currentAudio, play]);

  const setOfflineMode = useCallback((offline: boolean) => {
    setState((prev) => ({
      ...prev,
      isOfflineMode: offline,
    }));
  }, []);

  const value: AudioPlayerContextType = {
    state,
    play,
    pause,
    resume,
    seek,
    setVolume,
    next,
    previous,
    setOfflineMode,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
};
