"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Play,
  Pause,
  Music2,
  X,
  Clock,
  Check,
} from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioContext";
import PlaylistManager from "@/components/PlaylistManager";
import type { Audio } from "@/lib/types";

interface Playlist {
  id: string;
  name: string;
  description?: string;
  created: number;
  updated: number;
  audios: Audio[];
}

export default function PlaylistScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playlistId = searchParams.get("id");
  const shareData = searchParams.get("data");

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);

  const { state, playFromPlaylist, pause, resume } = useAudioPlayer();

  useEffect(() => {
    loadPlaylist();
  }, [playlistId, shareData]);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = () => {
      if (showMenu) setShowMenu(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  const loadPlaylist = () => {
    if (shareData) {
      try {
        const data = JSON.parse(atob(shareData));
        // Create temporary shared playlist
        setPlaylist({
          id: "shared-" + Date.now(),
          name: data.name,
          audios: [], // Would need to fetch audio details from IDs
          created: Date.now(),
          updated: Date.now(),
        });
      } catch (err) {
        console.error("Failed to parse share data:", err);
      }
    } else if (playlistId) {
      const saved = localStorage.getItem("playlists");
      if (saved) {
        const playlists: Playlist[] = JSON.parse(saved);
        const found = playlists.find((p) => p.id === playlistId);
        setPlaylist(found || null);
        if (found) setEditName(found.name);
      }
    }
  };

  const savePlaylist = (updatedPlaylist: Playlist) => {
    const saved = localStorage.getItem("playlists");
    if (saved) {
      const playlists: Playlist[] = JSON.parse(saved);
      const updated = playlists.map((p) =>
        p.id === updatedPlaylist.id ? updatedPlaylist : p,
      );
      localStorage.setItem("playlists", JSON.stringify(updated));
      setPlaylist(updatedPlaylist);
    }
  };

  const renamePlaylist = () => {
    if (!playlist || !editName.trim()) return;

    const updated = { ...playlist, name: editName.trim(), updated: Date.now() };
    savePlaylist(updated);
    setIsEditingName(false);
  };

  const deletePlaylist = () => {
    if (!playlist) return;

    const saved = localStorage.getItem("playlists");
    if (saved) {
      const playlists: Playlist[] = JSON.parse(saved);
      const updated = playlists.filter((p) => p.id !== playlist.id);
      localStorage.setItem("playlists", JSON.stringify(updated));
      router.push("/");
    }
  };

  const sharePlaylist = () => {
    if (!playlist) return;

    const data = {
      name: playlist.name,
      audioIds: playlist.audios.map((a) => a.id),
    };

    const encoded = btoa(JSON.stringify(data));
    const link = `${window.location.origin}/playlist?data=${encoded}`;

    if (navigator.share) {
      navigator.share({
        title: playlist.name,
        text: `Check out this playlist: ${playlist.name}`,
        url: link,
      });
    } else {
      navigator.clipboard.writeText(link);
      alert("Playlist link copied to clipboard!");
    }
  };

  const handlePlayAudio = (audio: Audio) => {
    if (state.currentAudio?.id === audio.id && state.isPlaying) {
      pause();
    } else if (state.currentAudio?.id === audio.id) {
      resume();
    } else {
      // Play from this playlist
      playFromPlaylist(
        audio,
        playlist?.audios || [],
        playlist?.name || "Playlist",
      );
    }
  };

  const removeFromPlaylist = (audioId: string) => {
    if (!playlist) return;

    const updated = {
      ...playlist,
      audios: playlist.audios.filter((a) => a.id !== audioId),
      updated: Date.now(),
    };

    savePlaylist(updated);
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!playlist) {
    return (
      <main className="min-h-svh bg-background pb-28">
        <header className="sticky top-0 border-b border-border/60 bg-background/85 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl border border-border">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-semibold">Playlist not found</h1>
          </div>
        </header>

        <div className="p-8 text-center text-muted-foreground">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>This playlist doesn't exist or has been deleted.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 border-b border-border/60 bg-background/85 backdrop-blur-xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl border border-border">
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-transparent text-base font-semibold outline-none border-b border-primary"
                  autoFocus
                />
                <button
                  onClick={renamePlaylist}
                  className="p-1 rounded-lg bg-primary text-primary-foreground"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setEditName(playlist.name);
                  }}
                  className="p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h1 className="text-base font-semibold truncate">
                {playlist.name}
              </h1>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 rounded-xl border border-border"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-white/20 bg-card/95 backdrop-blur-xl shadow-lg z-10 py-1">
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    sharePlaylist();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
                <button
                  onClick={() => {
                    deletePlaylist();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{playlist.audios.length} tracks</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(
                playlist.audios.reduce(
                  (total, audio) => total + (audio.duration || 0),
                  0,
                ),
              )}
            </span>
          </div>
          <span>Updated {new Date(playlist.updated).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Playlist Content */}
      <section className="p-4">
        {playlist.audios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tracks in this playlist yet.</p>
            <button
              onClick={() => setShowPlaylistManager(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm"
            >
              Add Tracks
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {playlist.audios.map((audio, index) => {
              const isCurrentAudio = state.currentAudio?.id === audio.id;
              const isPlaying = isCurrentAudio && state.isPlaying;

              return (
                <div
                  key={audio.id}
                  className="group flex items-center gap-3 p-3 rounded-2xl border border-border/70 bg-card/80 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground w-6 text-center">
                      {index + 1}
                    </span>

                    <button
                      onClick={() => handlePlayAudio(audio)}
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/90 to-accent text-primary-foreground"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate text-sm font-medium ${
                          isCurrentAudio
                            ? "text-primary"
                            : "text-card-foreground"
                        }`}
                      >
                        {audio.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {audio.duration
                          ? formatDuration(audio.duration)
                          : "0:00"}
                      </p>

                      {isCurrentAudio && (
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${
                                (state.currentTime / (state.duration || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromPlaylist(audio.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
                    aria-label="Remove from playlist"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Playlist Manager Modal */}
      <PlaylistManager
        isOpen={showPlaylistManager}
        onClose={() => setShowPlaylistManager(false)}
      />
    </main>
  );
}
