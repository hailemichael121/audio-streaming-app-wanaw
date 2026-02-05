"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import copy from "clipboard-copy";

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
import toast from "react-hot-toast";

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
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [sharePreviewData, setSharePreviewData] = useState<{
    previewUrl: string | null;
    shareText: string;
    shareUrl: string;
    fullMessage: string;
  } | null>(null);
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

  const sharePlaylist = async () => {
    if (!playlist) return;

    const playlistName = playlist.name || "My Playlist";
    const trackCount = playlist.audios.length;
    const shareText = `${playlistName} – ${trackCount} track${trackCount !== 1 ? "s" : ""}`;
    const shareUrl = `${window.location.origin}/playlist?id=${playlist.id}`;
    const fullShareMessage = `${shareText}\n\n${shareUrl}`;

    try {
      toast.loading("Preparing playlist card...");

      // Pick random audio image (or fallback)
      let selectedImage = "/images/mahder.png";
      if (playlist.audios.length > 0) {
        const randomAudio =
          playlist.audios[Math.floor(Math.random() * playlist.audios.length)];
        selectedImage = "/images/mahder.png";
      }

      // Small square card: 600x600
      const size = 600;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // Draw the image full-bleed (covers entire canvas)
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        img.onload = () => {
          // Cover entire canvas (object-cover style)
          const imgRatio = img.width / img.height;
          const canvasRatio = size / size; // square

          let drawWidth, drawHeight, drawX, drawY;

          if (imgRatio > canvasRatio) {
            drawHeight = size;
            drawWidth = drawHeight * imgRatio;
            drawX = (size - drawWidth) / 2;
            drawY = 0;
          } else {
            drawWidth = size;
            drawHeight = drawWidth / imgRatio;
            drawX = 0;
            drawY = (size - drawHeight) / 2;
          }

          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

          resolve();
        };
        img.onerror = () => {
          // Fallback: draw default image if failed
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(0, 0, size, size);
          resolve();
        };
        img.src = selectedImage;
      });

      // Subtle dark overlay at bottom for text readability (only bottom 40%)
      const bottomGradient = ctx.createLinearGradient(0, size * 0.6, 0, size);
      bottomGradient.addColorStop(0, "transparent");
      bottomGradient.addColorStop(0.5, "rgba(0,0,0,0.4)");
      bottomGradient.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, size * 0.6, size, size * 0.4);

      // Playlist name (big, white, bold)
      ctx.font = "bold 48px system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(playlistName, size / 2, size - 100);

      // Track count (smaller, light)
      ctx.font = "36px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(
        `${trackCount} track${trackCount !== 1 ? "s" : ""}`,
        size / 2,
        size - 50,
      );

      // Small footer
      ctx.font = "24px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("መዝገበ ስብሐት", size / 2, size - 15);

      const previewUrl = canvas.toDataURL("image/png");

      setSharePreviewData({
        previewUrl,
        shareText,
        shareUrl,
        fullMessage: fullShareMessage,
      });
      setShowSharePreview(true);

      toast.dismiss();
    } catch (err) {
      console.error("Playlist share card failed:", err);
      toast.dismiss();

      // Fallback text share
      try {
        if (navigator.share) {
          await navigator.share({
            title: playlistName,
            text: shareText,
            url: shareUrl,
          });
          toast.success("Shared!");
        } else {
          await copy(fullShareMessage);
          toast.success("Link copied!");
        }
      } catch (fbErr) {
        alert(`Copy manually:\n\n${fullShareMessage}`);
        toast.error("Share failed");
      }
    }
  };

  const handleSimpleShare = async (
    shareText: string,
    shareUrl: string,
    fullMessage: string,
  ) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: playlist?.name || "Playlist",
          text: shareText,
          url: shareUrl,
        });
        toast.success("Playlist shared!");
      } else {
        await navigator.clipboard.writeText(fullMessage);
        toast.success("Playlist link copied to clipboard!");
      }
    } catch (shareErr) {
      console.error("Simple share failed:", shareErr);
      await navigator.clipboard.writeText(fullMessage);
      toast.success("Playlist link copied to clipboard!");
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
          <div className="h-9 w-9 rounded-xl overflow-hidden mb-2">
            <img
              src="/images/Tsenatsl3.png"
              alt="Disc"
              className="h-full w-full object-cover"
            />
          </div>{" "}
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
                  Share Playlist
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
            <div className="h-9 w-9 rounded-xl overflow-hidden mb-2">
              <img
                src="/images/Tsenatsl3.png"
                alt="Disc"
                className="h-full w-full object-cover"
              />
            </div>{" "}
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
      {/* Share Preview Modal */}
      {showSharePreview && sharePreviewData && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
          <div className="bg-card/90 rounded-2xl max-w-sm w-full shadow-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-semibold">Playlist Share Card</h3>
              <button
                onClick={() => {
                  setShowSharePreview(false);
                  setSharePreviewData(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="p-6 flex justify-center">
              {sharePreviewData.previewUrl ? (
                <img
                  src={sharePreviewData.previewUrl}
                  alt="Playlist share card"
                  className="w-64 h-64 rounded-2xl shadow-xl object-cover"
                />
              ) : (
                <div className="w-64 h-64 bg-black/30 rounded-2xl flex items-center justify-center text-white/60">
                  <Music2 className="h-16 w-16" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={async () => {
                  setShowSharePreview(false);
                  setSharePreviewData(null);

                  try {
                    if (sharePreviewData.previewUrl) {
                      const blob = await fetch(
                        sharePreviewData.previewUrl,
                      ).then((r) => r.blob());
                      const file = new File([blob], "playlist-card.png", {
                        type: "image/png",
                      });

                      if (
                        navigator.canShare &&
                        navigator.canShare({ files: [file] })
                      ) {
                        await navigator.share({
                          title: playlist?.name || "Playlist",
                          text: sharePreviewData.shareText,
                          url: sharePreviewData.shareUrl,
                          files: [file],
                        });
                        toast.success("Shared with card!");
                        return;
                      }
                    }

                    // Text fallback
                    if (navigator.share) {
                      await navigator.share({
                        title: playlist?.name || "Playlist",
                        text: sharePreviewData.shareText,
                        url: sharePreviewData.shareUrl,
                      });
                      toast.success("Shared!");
                    } else {
                      await copy(sharePreviewData.fullMessage);
                      toast.success("Link copied!");
                    }
                  } catch (err) {
                    await copy(sharePreviewData.fullMessage);
                    toast.success("Link copied!");
                  }
                }}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>

              <button
                onClick={() => {
                  setShowSharePreview(false);
                  setSharePreviewData(null);
                }}
                className="px-5 py-2.5 bg-white/10 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Playlist Manager Modal */}
      <PlaylistManager
        isOpen={showPlaylistManager}
        onClose={() => setShowPlaylistManager(false)}
      />
    </main>
  );
}
