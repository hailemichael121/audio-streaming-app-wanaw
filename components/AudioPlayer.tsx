"use client";

import React, { useMemo, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Repeat,
  ChevronDown,
  Share2,
  ListMusic,
  Plus,
  X,
  Gauge,
} from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioContext";
import { Spinner } from "@/components/ui/spinner";
import AddToPlaylistDialog from "@/components/AddToPlaylistDialog";
import {
  AudioArtworkSkeleton,
  AudioTitleRowSkeleton,
  AudioProgressSkeleton,
  AudioPlaybackControlsSkeleton,
} from "./AudioPlayerSkeleton";

export default function AudioPlayer() {
  const {
    state,
    pause,
    resume,
    seek,
    setPlaybackRate,
    next,
    previous,
    toggleLoop,
    addToPlaylist,
    removeFromPlaylist,
    setPlaylistName,
  } = useAudioPlayer();
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showAddToPlaylistDialog, setShowAddToPlaylistDialog] = useState(false);

  // Create safe alias if currentAudio exists
  const audio = state.currentAudio;

  const handlePlayPause = () => {
    if (!audio) return;

    if (state.isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const formatTime = (time: number) => {
    if (!time || Number.isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Safe progress calculation
  const progress = useMemo(() => {
    if (!state.duration) return 0;
    return Math.min(100, (state.currentTime / state.duration) * 100);
  }, [state.currentTime, state.duration]);

  const onShare = async () => {
    if (!audio || typeof navigator === "undefined") return;
    const payload = {
      title: audio.title,
      text: `Listening to ${audio.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(payload).catch(() => undefined);
      return;
    }

    await navigator.clipboard
      ?.writeText(`${payload.title} - ${payload.url}`)
      .catch(() => undefined);
  };

  // Handle opening full player - always allow it even when loading
  const handleOpenFullPlayer = () => {
    setIsFullPlayerOpen(true);
  };

  // If there's no current audio and not loading, don't show player
  if (!state.currentAudio && !state.isLoading) {
    return null;
  }

  return (
    <>
      {/* Simplified Mini Player - Always show when loading or has audio */}
      {!isFullPlayerOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <button
            type="button"
            className="mx-auto block w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-card/90 text-left shadow-xl backdrop-blur-xl disabled:opacity-70"
            onClick={handleOpenFullPlayer}
            disabled={state.isLoading && !audio}
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-accent/80 text-primary-foreground shadow-lg">
                  {state.isLoading ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Music2 className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {state.isLoading
                      ? "Loading..."
                      : audio?.title || "No track selected"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {state.isLoading
                      ? "Buffering…"
                      : state.isPlaying
                        ? "Now playing"
                        : audio
                          ? "Ready to play"
                          : "Select a track"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      previous();
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous track"
                    type="button"
                    disabled={!audio || state.isLoading}
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause();
                    }}
                    disabled={state.isLoading || !audio}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    aria-label={state.isPlaying ? "Pause" : "Play"}
                  >
                    {state.isLoading ? (
                      <Spinner className="h-4 w-4" />
                    ) : state.isPlaying ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next track"
                    type="button"
                    disabled={!audio || state.isLoading}
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Full Player */}
      {isFullPlayerOpen && (
        <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-2xl">
          <div className="mobile-shell flex h-full flex-col px-4 pb-6 pt-[max(env(safe-area-inset-top),1rem)]">
            <div className="flex items-center justify-between">
              <button
                className="glass-chip p-2"
                onClick={() => setIsFullPlayerOpen(false)}
                aria-label="Back to app"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
              <button
                className="glass-chip p-2"
                onClick={onShare}
                aria-label="Share current audio"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-1 flex-col justify-between gap-6">
              {/* Artwork Card */}
              {state.isLoading ? (
                <AudioArtworkSkeleton />
              ) : audio ? (
                <div className="rounded-3xl border border-white/20 bg-card/60 p-8 text-center">
                  <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/90 to-accent/80 text-primary-foreground shadow-2xl">
                    <Music2 className="h-16 w-16" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{audio.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {state.playlistName}
                  </p>
                </div>
              ) : (
                <AudioArtworkSkeleton />
              )}

              <div className="space-y-4">
                <div className="space-y-5">
                  {/* TITLE + ACTION BUTTONS */}
                  {state.isLoading ? (
                    <AudioTitleRowSkeleton />
                  ) : audio ? (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold">
                          {audio.title}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {state.playlistName}
                        </p>
                      </div>

                      <div className="flex items-center gap-5">
                        {/* Repeat */}
                        <button
                          onClick={toggleLoop}
                          className={`player-control ${state.isLooping ? "bg-primary/20 text-primary" : ""}`}
                          aria-label="Repeat"
                        >
                          <Repeat className="h-6 w-6" />
                        </button>

                        {/* Speed */}
                        <div className="relative">
                          <button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="player-control"
                            aria-label="Playback speed"
                          >
                            <Gauge className="h-6 w-6" />
                          </button>

                          {showSpeedMenu && (
                            <div className="absolute right-0 top-full mt-2 w-28 rounded-xl border border-white/20 bg-card/95 backdrop-blur-xl shadow-lg p-2 z-20">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => {
                                    setPlaybackRate(rate);
                                    setShowSpeedMenu(false);
                                  }}
                                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                                    state.playbackRate === rate
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-white/10"
                                  }`}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add to Playlist */}
                        <button
                          onClick={() => setShowAddToPlaylistDialog(true)}
                          className="player-control"
                          aria-label="Add to playlist"
                        >
                          <Plus className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <AudioTitleRowSkeleton />
                  )}

                  {/* PROGRESS BAR */}
                  {state.isLoading ? (
                    <AudioProgressSkeleton />
                  ) : audio ? (
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="0"
                        max={state.duration || 0}
                        value={state.currentTime}
                        onChange={(e) => seek(Number(e.target.value))}
                        className="player-slider h-1.5 w-full appearance-none cursor-pointer rounded-full"
                        style={{ backgroundSize: `${progress}% 100%` }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(state.currentTime)}</span>
                        <span>{formatTime(state.duration)}</span>
                      </div>
                    </div>
                  ) : (
                    <AudioProgressSkeleton />
                  )}

                  {/* PLAYBACK CONTROLS */}
                  {state.isLoading ? (
                    <AudioPlaybackControlsSkeleton />
                  ) : audio ? (
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={previous}
                        className="player-control"
                        aria-label="Previous"
                      >
                        <SkipBack className="h-6 w-6" />
                      </button>

                      <button
                        onClick={handlePlayPause}
                        className="player-play"
                        aria-label="Play or pause"
                      >
                        {state.isPlaying ? (
                          <Pause className="h-7 w-7 fill-current text-primary-foreground" />
                        ) : (
                          <Play className="ml-0.5 h-7 w-7 fill-current text-primary-foreground" />
                        )}
                      </button>

                      <button
                        onClick={next}
                        className="player-control"
                        aria-label="Next"
                      >
                        <SkipForward className="h-6 w-6" />
                      </button>
                    </div>
                  ) : (
                    <AudioPlaybackControlsSkeleton />
                  )}
                </div>

                {/* Playlist Section */}
                <div className="glass-panel p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="inline-flex items-center gap-2 text-sm font-medium">
                      <ListMusic className="h-4 w-4" /> Playlist
                    </p>
                    <button
                      className="glass-chip p-2"
                      onClick={() => setShowAddToPlaylistDialog(true)}
                      aria-label="Add current audio to playlist"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={state.playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="mb-2 w-full rounded-xl border border-white/20 bg-background/40 px-3 py-2 text-sm outline-none"
                    aria-label="Playlist name"
                  />
                  <div className="max-h-28 space-y-2 overflow-auto">
                    {state.playlist.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No tracks in playlist yet.
                      </p>
                    ) : (
                      state.playlist.map((playlistAudio) => (
                        <div
                          key={playlistAudio.id}
                          className="flex items-center justify-between rounded-xl bg-background/40 px-3 py-2"
                        >
                          <p className="truncate pr-2 text-xs">
                            {playlistAudio.title}
                          </p>
                          <button
                            onClick={() => removeFromPlaylist(playlistAudio.id)}
                            aria-label={`Remove ${playlistAudio.title}`}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Dialog */}
      {audio && (
        <AddToPlaylistDialog
          audio={audio}
          isOpen={showAddToPlaylistDialog}
          onClose={() => setShowAddToPlaylistDialog(false)}
          onSuccess={() => {
            // Optional: Show success message or update UI
          }}
        />
      )}
    </>
  );
}
