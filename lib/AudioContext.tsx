"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Audio, PlayerState, AudioPlayerContextType } from "./types";
import {
  MediaSessionManager,
  requestWakeLock,
  releaseWakeLock,
} from "./mediaSessionService";

export type RepeatMode = "off" | "one" | "all";

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined,
);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSessionRef = useRef<MediaSessionManager | null>(null);
  const [state, setState] = useState<PlayerState>({
    currentAudio: null,
    queue: [],
    currentIndex: -1,
    playlist: [], // Current playlist/queue to display
    playlistName: "Queue", // Dynamic playlist name based on source
    playlistSource: "queue", // 'queue' | 'search' | 'day' | 'playlist'
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isLooping: false,
    playbackRate: 1,
    isOfflineMode: false,
  });

  // Add repeat mode state
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  const getPlayableUrl = useCallback((rawUrl: string) => {
    if (typeof window === "undefined") return rawUrl;

    try {
      if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
        const u = new URL(rawUrl);
        if (u.origin !== window.location.origin) {
          return `/api/audio/proxy?url=${encodeURIComponent(rawUrl)}`;
        }
      }
    } catch {
      // ignore malformed URLs and use raw value
    }

    return rawUrl;
  }, []);

  const syncMediaSession = useCallback(
    (
      isPlaying: boolean,
      currentTime: number,
      duration: number,
      playbackRate: number,
    ) => {
      mediaSessionRef.current?.updatePlaybackState(
        isPlaying,
        currentTime,
        duration,
        playbackRate,
      );
    },
    [],
  );

  const playAudioInternal = useCallback(
    (
      audio: Audio,
      playlistName?: string,
      playlistSource?: PlayerState["playlistSource"],
    ) => {
      if (!audioRef.current) return;

      const url = getPlayableUrl(audio.localPath || audio.url);

      setState((prev) => ({
        ...prev,
        currentAudio: audio,
        isPlaying: true,
        isLoading: true,
        currentTime: 0,
        playlistName: playlistName || prev.playlistName,
        playlistSource: playlistSource || prev.playlistSource,
      }));

      audioRef.current.src = url;
      audioRef.current.playbackRate = state.playbackRate;

      const clearLoading = () =>
        setState((prev) => ({ ...prev, isLoading: false }));
      const handleCanPlay = () => {
        clearLoading();
        audioRef.current?.removeEventListener("error", handleError);
      };
      const handleError = () => {
        clearLoading();
        audioRef.current?.removeEventListener("canplay", handleCanPlay);
      };

      audioRef.current.addEventListener("canplay", handleCanPlay, {
        once: true,
      });
      audioRef.current.addEventListener("error", handleError, { once: true });

      audioRef.current.play().catch(() => clearLoading());

      mediaSessionRef.current?.updateMetadata(audio);
      requestWakeLock();
    },
    [getPlayableUrl, state.playbackRate],
  );

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.queue.length === 0 || prev.currentIndex < 0) return prev;
      const nextIndex = (prev.currentIndex + 1) % prev.queue.length;
      setTimeout(() => playAudioInternal(prev.queue[nextIndex]), 0);
      return { ...prev, currentIndex: nextIndex };
    });
  }, [playAudioInternal]);

  const previous = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setState((prev) => ({ ...prev, currentTime: 0 }));
      return;
    }

    setState((prev) => {
      if (prev.queue.length === 0 || prev.currentIndex < 0) return prev;
      const prevIndex =
        prev.currentIndex === 0 ? prev.queue.length - 1 : prev.currentIndex - 1;
      setTimeout(() => playAudioInternal(prev.queue[prevIndex]), 0);
      return { ...prev, currentIndex: prevIndex };
    });
  }, [playAudioInternal]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
      audioRef.current.crossOrigin = "anonymous";

      mediaSessionRef.current = new MediaSessionManager({
        play: () => audioRef.current?.play().catch(() => undefined),
        pause: () => audioRef.current?.pause(),
        next,
        previous,
        seek: (time: number) => {
          if (audioRef.current) audioRef.current.currentTime = time;
        },
      });
    }

    return () => mediaSessionRef.current?.destroy();
  }, [next, previous, state.volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const currentTime = audio.currentTime || 0;
      setState((prev) => ({ ...prev, currentTime }));
      syncMediaSession(
        !audio.paused,
        currentTime,
        audio.duration || 0,
        audio.playbackRate || 1,
      );
    };

    const updateDuration = () => {
      const duration = audio.duration || 0;
      setState((prev) => ({ ...prev, duration }));
      syncMediaSession(
        !audio.paused,
        audio.currentTime || 0,
        duration,
        audio.playbackRate || 1,
      );
    };

    const updatePlayingState = () => {
      const isPlaying = !audio.paused;
      setState((prev) => ({ ...prev, isPlaying }));
      syncMediaSession(
        isPlaying,
        audio.currentTime || 0,
        audio.duration || 0,
        audio.playbackRate || 1,
      );
    };

    const setBuffering = () =>
      setState((prev) => ({ ...prev, isLoading: true }));
    const clearBuffering = () =>
      setState((prev) => ({ ...prev, isLoading: false }));

    const handleEnded = () => {
      setState((prev) => {
        // Repeat one mode
        if (repeatMode === "one" && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => undefined);
          return { ...prev, currentTime: 0, isPlaying: true };
        }

        // Repeat all mode
        if (
          repeatMode === "all" &&
          prev.queue.length > 0 &&
          prev.currentIndex >= 0
        ) {
          const nextIndex = (prev.currentIndex + 1) % prev.queue.length;
          setTimeout(() => playAudioInternal(prev.queue[nextIndex]), 0);
          return { ...prev, currentIndex: nextIndex };
        }

        // Repeat off mode - don't play next, just stop
        if (repeatMode === "off") {
          return { ...prev, isPlaying: false };
        }

        // Default behavior (for backward compatibility or edge cases)
        if (prev.queue.length > 0 && prev.currentIndex >= 0) {
          const nextIndex = prev.currentIndex + 1;
          if (nextIndex < prev.queue.length) {
            setTimeout(() => playAudioInternal(prev.queue[nextIndex]), 0);
            return { ...prev, currentIndex: nextIndex };
          }
        }

        return { ...prev, isPlaying: false };
      });
    };
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", updatePlayingState);
    audio.addEventListener("pause", updatePlayingState);
    audio.addEventListener("ratechange", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", setBuffering);
    audio.addEventListener("playing", clearBuffering);
    audio.addEventListener("canplay", clearBuffering);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", updatePlayingState);
      audio.removeEventListener("pause", updatePlayingState);
      audio.removeEventListener("ratechange", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", setBuffering);
      audio.removeEventListener("playing", clearBuffering);
      audio.removeEventListener("canplay", clearBuffering);
    };
  }, [playAudioInternal, syncMediaSession, repeatMode]);

  const play = useCallback(
    (
      audio: Audio,
      queue?: Audio[],
      sourceName?: string,
      sourceType?: PlayerState["playlistSource"],
    ) => {
      setState((prev) => {
        const nextQueue = queue && queue.length > 0 ? queue : prev.queue;
        const nextIndex = nextQueue.findIndex((item) => item.id === audio.id);
        const playlistName =
          sourceName || (queue ? `${queue.length} tracks` : "Queue");
        const playlistSource: PlayerState["playlistSource"] =
          sourceType ?? "queue";
        return {
          ...prev,
          queue: nextQueue,
          currentIndex: nextIndex,
          playlist: nextQueue, // Set playlist to the current queue
          playlistName,
          playlistSource,
        };
      });
      playAudioInternal(audio);
    },
    [playAudioInternal],
  );

  const playFromDay = useCallback(
    (audio: Audio, dayAudios: Audio[], dayName: string) => {
      setState((prev) => ({
        ...prev,
        queue: dayAudios,
        currentIndex: dayAudios.findIndex((item) => item.id === audio.id),
        playlist: dayAudios,
        playlistName: dayName,
        playlistSource: "day",
      }));
      playAudioInternal(audio, dayName, "day");
    },
    [playAudioInternal],
  );

  const playFromSearch = useCallback(
    (audio: Audio, searchResults: Audio[]) => {
      setState((prev) => ({
        ...prev,
        queue: searchResults,
        currentIndex: searchResults.findIndex((item) => item.id === audio.id),
        playlist: searchResults,
        playlistName: "Search Results",
        playlistSource: "search",
      }));
      playAudioInternal(audio, "Search Results", "search");
    },
    [playAudioInternal],
  );

  const playFromPlaylist = useCallback(
    (audio: Audio, playlistAudios: Audio[], playlistName: string) => {
      setState((prev) => ({
        ...prev,
        queue: playlistAudios,
        currentIndex: playlistAudios.findIndex((item) => item.id === audio.id),
        playlist: playlistAudios,
        playlistName: playlistName,
        playlistSource: "playlist",
      }));
      playAudioInternal(audio, playlistName, "playlist");
    },
    [playAudioInternal],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((prev) => ({ ...prev, isPlaying: false }));
    releaseWakeLock();
    syncMediaSession(
      false,
      audioRef.current?.currentTime || 0,
      audioRef.current?.duration || 0,
      audioRef.current?.playbackRate || 1,
    );
  }, [syncMediaSession]);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => undefined);
    setState((prev) => ({ ...prev, isPlaying: true }));
    requestWakeLock();
    syncMediaSession(
      true,
      audioRef.current?.currentTime || 0,
      audioRef.current?.duration || 0,
      audioRef.current?.playbackRate || 1,
    );
  }, [syncMediaSession]);

  const seek = useCallback(
    (time: number) => {
      if (audioRef.current) audioRef.current.currentTime = time;
      setState((prev) => ({ ...prev, currentTime: time }));
      syncMediaSession(
        !audioRef.current?.paused || false,
        time,
        audioRef.current?.duration || 0,
        audioRef.current?.playbackRate || 1,
      );
    },
    [syncMediaSession],
  );

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    if (audioRef.current) audioRef.current.volume = clamped;
    setState((prev) => ({ ...prev, volume: clamped }));
  }, []);

  const toggleLoop = useCallback(() => {
    setState((prev) => ({ ...prev, isLooping: !prev.isLooping }));
  }, []);

  const toggleRepeatMode = useCallback(
    (mode?: RepeatMode) => {
      let newMode: RepeatMode;

      if (mode) {
        newMode = mode;
      } else {
        // Cycle through modes
        const modes: RepeatMode[] = ["off", "one", "all"];
        const currentIndex = modes.indexOf(repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        newMode = modes[nextIndex];
      }

      setRepeatMode(newMode);

      // Update audio element's loop property (only for "one" mode)
      if (audioRef.current) {
        // HTML audio loop attribute only handles single track repeat
        audioRef.current.loop = newMode === "one";
      }
    },
    [repeatMode],
  );

  const setPlaybackRate = useCallback(
    (rate: number) => {
      const clamped = Math.max(0.2, Math.min(2, rate));
      if (audioRef.current) {
        audioRef.current.playbackRate = clamped;
        syncMediaSession(
          !audioRef.current.paused,
          audioRef.current.currentTime || 0,
          audioRef.current.duration || 0,
          clamped,
        );
      }
      setState((prev) => ({ ...prev, playbackRate: clamped }));
    },
    [syncMediaSession],
  );

  const addToPlaylist = useCallback((audio: Audio) => {
    setState((prev) => {
      if (prev.playlist.some((item) => item.id === audio.id)) return prev;
      return { ...prev, playlist: [...prev.playlist, audio] };
    });
  }, []);

  const removeFromPlaylist = useCallback((audioId: string) => {
    setState((prev) => ({
      ...prev,
      playlist: prev.playlist.filter((item) => item.id !== audioId),
    }));
  }, []);

  const setPlaylistName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, playlistName: name.trim() || "Queue" }));
  }, []);

  const setOfflineMode = useCallback((offline: boolean) => {
    setState((prev) => ({ ...prev, isOfflineMode: offline }));
  }, []);

  const value: AudioPlayerContextType = {
    state,
    repeatMode,

    play,
    playFromDay,
    playFromSearch,
    playFromPlaylist,
    pause,
    resume,
    seek,
    setVolume,
    setPlaybackRate,
    next,
    previous,
    toggleLoop,
    toggleRepeatMode,
    addToPlaylist,
    removeFromPlaylist,
    setPlaylistName,
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
  if (!context)
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return context;
};
