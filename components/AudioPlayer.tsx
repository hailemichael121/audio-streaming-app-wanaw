"use client";

import { useMemo, useState, useEffect } from "react";
import copy from "clipboard-copy";
import { debounce } from "lodash";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Repeat,
  Repeat1,
  ChevronDown,
  Share2,
  ListMusic,
  Plus,
  X,
  Gauge,
  GripVertical,
  Maximize2,
  Minimize2,
  ChevronUp,
} from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioContext";
import { Spinner } from "@/components/ui/spinner";
import AddToPlaylistDialog from "@/components/AddToPlaylistDialog";
import {
  AudioArtworkSkeleton,
  AudioProgressSkeleton,
  AudioPlaybackControlsSkeleton,
  AudioTitleSkeleton,
  AudioActionButtonsSkeleton,
} from "./AudioPlayerSkeleton";
import toast, { Toaster } from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AudioArtworkCard } from "./AudioCard";
import { SortableItem } from "./SortableItem";

export default function AudioPlayer() {
  const {
    state,
    repeatMode, // Get repeatMode from context
    pause,
    resume,
    seek,
    setPlaybackRate,
    next,
    previous,
    toggleRepeatMode,
    removeFromPlaylist,
    play,
  } = useAudioPlayer();

  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showAddToPlaylistDialog, setShowAddToPlaylistDialog] = useState(false);
  const [playlistHeight, setPlaylistHeight] = useState(112);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localPlaylist, setLocalPlaylist] = useState(state.playlist);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [sharePreviewData, setSharePreviewData] = useState<{
    previewUrl: string | null;
    shareText: string;
    shareUrl: string;
    fullMessage: string;
  } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // All hooks must be at the top, unconditionally
  const artworkImages = useMemo(
    () => [
      "/images/Kdus_Yared1.png",
      "/images/Kdus_Yared2.png",
      "/images/Kdus_Yared3.png",
      "/images/Kdus_Yared4.png",
    ],
    [],
  );

  // Create safe alias if currentAudio exists
  const audio = state.currentAudio;

  const artworkImage = useMemo(() => {
    if (!audio) return null;
    const index = Math.floor(Math.random() * artworkImages.length);
    return artworkImages[index];
  }, [audio, artworkImages]);

  // DND-Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15, // Reduced sensitivity
        delay: 100,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Even longer delay for touch
        tolerance: 20, // More tolerance for touch movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setLocalPlaylist(state.playlist);
  }, [state.playlist]);
  const showReorderToast = debounce(() => {
    toast.success("Playlist order updated!", {
      duration: 1800,
      position: "bottom-center",
      style: {
        background: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        borderRadius: "12px",
      },
    });
  }, 300);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalPlaylist((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        // Skip if dropped in the same position (no change)
        if (oldIndex === newIndex) {
          return items;
        }

        // Reorder
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Show debounced toast (only once per burst of drags)
        showReorderToast();

        return newItems;
      });
    }
  };

  // Toggle playlist expansion
  const toggleExpand = () => {
    if (isExpanded) {
      setPlaylistHeight(112);
    } else {
      setPlaylistHeight(280);
    }
    setIsExpanded(!isExpanded);

    // Show toast for expansion state
    toast.success(isExpanded ? "Playlist collapsed" : "Playlist expanded", {
      duration: 1500,
      position: "bottom-center",
      style: {
        background: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        borderRadius: "12px",
      },
    });
  };

  const handleRepeatToggle = () => {
    toggleRepeatMode(); // This will cycle through modes

    // Show toast - you're showing NEXT mode, not current
    const modes = ["off", "one", "all"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex]; // This shows what it WILL BE

    const modeMessages = {
      off: "Repeat: Off",
      one: "Repeat: One",
      all: "Repeat: All",
    };

    toast.success(modeMessages[nextMode as keyof typeof modeMessages], {
      duration: 1500,
      position: "bottom-center",
      style: {
        background: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        borderRadius: "12px",
      },
    });
  };
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
    if (!audio || !artworkImage) {
      toast.error("Nothing to share right now");
      return;
    }

    // Prepare data
    const shareText = `Listening to "${audio?.title || "Unknown Track"}" • ${state.playlistName || "Playlist"}`;
    const shareUrl = window.location.href;
    const fullShareMessage = `${shareText}\n\n${shareUrl}`;

    try {
      toast.loading("Creating share card...");

      // Get the exact AudioArtworkCard element
      const audioCardElement = document.querySelector(
        "[data-audio-artwork-card]",
      );

      if (!audioCardElement) {
        throw new Error("Audio card not found");
      }

      // Get the actual image element inside the card
      const imgElement = audioCardElement.querySelector("img");
      const cardBackgroundColor =
        getComputedStyle(audioCardElement).backgroundColor;

      // Get title and subtitle elements
      const titleElement = audioCardElement.querySelector("h2");
      const subtitleElement = audioCardElement.querySelector("p");

      const titleText = titleElement?.textContent || audio?.title || "";
      const subtitleText =
        subtitleElement?.textContent || state.playlistName || "";

      // Create canvas with exact card dimensions (340x340 on mobile, 380x380 on desktop)
      const cardWidth = audioCardElement.clientWidth;
      const cardHeight = audioCardElement.clientHeight;

      const canvas = document.createElement("canvas");
      canvas.width = cardWidth * 2; // 2x for better quality
      canvas.height = cardHeight * 2;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas not supported");

      // Draw background with exact card color
      ctx.fillStyle = cardBackgroundColor || "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

      // Draw rounded corners
      const borderRadius = 48; // 1.5rem * 2 (scaled)
      ctx.beginPath();
      ctx.moveTo(borderRadius, 0);
      ctx.lineTo(canvas.width - borderRadius, 0);
      ctx.quadraticCurveTo(canvas.width, 0, canvas.width, borderRadius);
      ctx.lineTo(canvas.width, canvas.height - borderRadius);
      ctx.quadraticCurveTo(
        canvas.width,
        canvas.height,
        canvas.width - borderRadius,
        canvas.height,
      );
      ctx.lineTo(borderRadius, canvas.height);
      ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - borderRadius);
      ctx.lineTo(0, borderRadius);
      ctx.quadraticCurveTo(0, 0, borderRadius, 0);
      ctx.closePath();
      ctx.clip();

      // Draw artwork image if available
      if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
        try {
          // Create a temporary canvas to process the image
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");

          if (tempCtx) {
            tempCanvas.width = imgElement.naturalWidth;
            tempCanvas.height = imgElement.naturalHeight;
            tempCtx.drawImage(imgElement, 0, 0);

            // Apply same scale as in the component
            const scale = 1 - 0 / 1000; // No swipe offset
            const scaledWidth = tempCanvas.width * scale;
            const scaledHeight = tempCanvas.height * scale;
            const x = (canvas.width - scaledWidth) / 2;
            const y = (canvas.height - scaledHeight) / 2;

            // Draw with object-contain behavior
            const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
            const canvasRatio = canvas.width / canvas.height;

            let drawWidth, drawHeight, drawX, drawY;

            if (imgRatio > canvasRatio) {
              // Image is wider than canvas
              drawHeight = canvas.height;
              drawWidth = drawHeight * imgRatio;
              drawX = (canvas.width - drawWidth) / 2;
              drawY = 0;
            } else {
              // Image is taller than canvas
              drawWidth = canvas.width;
              drawHeight = drawWidth / imgRatio;
              drawX = 0;
              drawY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(imgElement, drawX, drawY, drawWidth, drawHeight);
          }
        } catch (imgErr) {
          console.warn("Failed to draw image:", imgErr);
        }
      }

      // Draw gradient overlays (same as in AudioArtworkCard)
      const topGradient = ctx.createLinearGradient(0, 0, 0, 80 * 2);
      topGradient.addColorStop(0, "rgba(0, 0, 0, 0.3)");
      topGradient.addColorStop(1, "transparent");
      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, canvas.width, 80 * 2);

      const bottomGradient = ctx.createLinearGradient(
        0,
        canvas.height - 64 * 2,
        0,
        canvas.height,
      );
      bottomGradient.addColorStop(0, "rgba(0, 0, 0, 0.6)");
      bottomGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.3)");
      bottomGradient.addColorStop(1, "transparent");
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, canvas.height - 64 * 2, canvas.width, 64 * 2);

      // Draw title and subtitle (scaled up)
      const titleFontSize = 18 * 2; // 18px * 2 for quality
      const subtitleFontSize = 14 * 2;
      const padding = 20 * 2;

      // Title
      ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      // Wrap long titles
      const maxTitleWidth = canvas.width - padding * 2;
      let titleY = canvas.height - padding - subtitleFontSize - 5 * 2;

      if (titleText.length > 30) {
        // Split into two lines
        const words = titleText.split(" ");
        let line1 = "";
        let line2 = "";

        for (const word of words) {
          if ((line1 + " " + word).length <= 30) {
            line1 = line1 + (line1 ? " " : "") + word;
          } else {
            line2 = line2 + (line2 ? " " : "") + word;
          }
        }

        // Draw first line
        ctx.fillText(line1, padding, titleY - titleFontSize);

        // Draw second line if exists
        if (line2) {
          ctx.fillText(line2, padding, titleY);
        }
      } else {
        ctx.fillText(titleText, padding, titleY);
      }

      // Subtitle
      ctx.font = `${subtitleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText(subtitleText, padding, canvas.height - padding);

      // Add subtle shadow for depth
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Add "Now Playing" badge in top right corner
      ctx.font = `bold ${12 * 2}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textAlign = "right";
      ctx.fillText("▶ Now Playing", canvas.width - padding, padding + 20 * 2);

      // Add app name at the bottom
      ctx.font = `italic ${12 * 2}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.textAlign = "center";
      ctx.fillText("መዝገበ ስብሐት", canvas.width / 2, canvas.height - 10 * 2);

      const previewUrl = canvas.toDataURL("image/png");

      // Store all data for modal
      setSharePreviewData({
        previewUrl,
        shareText,
        shareUrl,
        fullMessage: fullShareMessage,
      });
      setShowSharePreview(true);

      toast.dismiss();
    } catch (err: any) {
      console.error("Share card creation failed:", err);
      toast.dismiss();

      // Fallback: Simple text share
      try {
        if (navigator.share) {
          await navigator.share({
            title: audio?.title || "Now Playing",
            text: shareText,
            url: shareUrl,
          });
          toast.success("Shared!");
        } else {
          await copy(fullShareMessage);
          toast.success("Copied to clipboard!");
        }
      } catch (fbErr) {
        console.error("Fallback share failed:", fbErr);
        alert(`Copy manually:\n\n${fullShareMessage}`);
        toast.error("Share failed — please copy manually");
      }
    }
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
      <Toaster />
      {/* Simplified Mini Player - Always show when loading or has audio */}
      {!isFullPlayerOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          {/* Changed from button → div */}
          <div
            className="mx-auto block w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-card/90 text-left shadow-xl backdrop-blur-xl cursor-pointer disabled:opacity-70"
            onClick={handleOpenFullPlayer}
            // You can keep disabled logic if needed, but usually not necessary for div
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-accent/80 text-primary-foreground shadow-lg">
                  {state.isLoading ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl overflow-hidden mb-2">
                      <img
                        src="/images/Tsenatsl3.png"
                        alt="Disc"
                        className="h-full w-full object-cover"
                      />
                    </div>
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
                      e.stopPropagation(); // ← prevents opening full player
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
          </div>
        </div>
      )}
      {/* Full Player */}
      {isFullPlayerOpen && (
        <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-2xl">
          <div className="mobile-shell flex h-full flex-col px-4 pt-[max(env(safe-area-inset-top),1rem)]">
            {/* Fixed header - always on top */}
            <div className="flex items-center justify-between pb-4 shrink-0">
              <button
                className="glass-chip p-2"
                onClick={() => setIsFullPlayerOpen(false)}
              >
                <ChevronDown className="h-5 w-5" />
              </button>
              <button className="glass-chip p-2" onClick={onShare}>
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable main content - this is the key change */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-8 space-y-6">
              {/* Artwork */}
              {state.isLoading ? (
                <AudioArtworkSkeleton />
              ) : (
                <AudioArtworkCard
                  artworkImage={artworkImage}
                  title={audio?.title}
                  subtitle={state.playlistName}
                  isLoading={state.isLoading}
                  data-audio-artwork-card
                />
              )}

              <div className="space-y-4">
                <div className="space-y-5">
                  {/* TITLE + ACTION BUTTONS */}
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      {/* Audio title - show immediately when audio exists */}
                      {audio ? (
                        <>
                          <h2 className="truncate pr-8 text-base font-semibold">
                            {audio.title}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {state.playlistName}
                          </p>
                        </>
                      ) : (
                        <AudioTitleSkeleton />
                      )}
                    </div>

                    {/* Right: Action buttons  */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      {state.isLoading ? (
                        <AudioActionButtonsSkeleton />
                      ) : audio ? (
                        <>
                          {/* Repeat Button */}
                          <button
                            onClick={handleRepeatToggle}
                            className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-white/10 active:scale-95"
                            aria-label={`Repeat mode: ${repeatMode}`}
                          >
                            <div
                              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                repeatMode === "off"
                                  ? "bg-transparent"
                                  : repeatMode === "one"
                                    ? "bg-primary/25 border border-primary/50 scale-105"
                                    : "bg-primary/20 border border-primary/40 scale-105"
                              }`}
                            />

                            {/* Show different icons based on repeat mode */}
                            {repeatMode === "one" ? (
                              <Repeat1
                                className={`h-5 w-5 transition-colors ${
                                  repeatMode === "one"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ) : repeatMode === "all" ? (
                              <Repeat
                                className={`h-5 w-5 transition-colors ${
                                  repeatMode === "all"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ) : (
                              // When repeat is off, show a crossed repeat icon
                              <div className="relative">
                                <Repeat className="h-5 w-5 text-muted-foreground" />
                                {/* Add a diagonal line through the icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-[2px] bg-muted-foreground rotate-45 transform origin-center" />
                                </div>
                              </div>
                            )}

                            {/* Only show the indicator dot when repeat is active */}
                            {(repeatMode === "one" || repeatMode === "all") && (
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary shadow-sm border border-white/40" />
                            )}
                          </button>

                          {/* Speed Button */}
                          <div className="relative">
                            <button
                              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                              className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-white/10 active:scale-95"
                              aria-label="Playback speed"
                            >
                              <div
                                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                  state.playbackRate !== 1
                                    ? "bg-primary/25 border border-primary/50 scale-105"
                                    : "bg-transparent"
                                }`}
                              />
                              <Gauge
                                className={`h-5 w-5 transition-colors ${
                                  state.playbackRate !== 1
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                              {state.playbackRate !== 1 && (
                                <div className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm border border-white/30">
                                  {state.playbackRate}x
                                </div>
                              )}
                            </button>

                            {/* Speed dropdown – kept the same but ensure it doesn't overlap */}
                            {showSpeedMenu && (
                              <div className="absolute right-0 top-full mt-2 w-32 rounded-xl border border-white/20 bg-card/95 backdrop-blur-xl shadow-2xl p-2 z-30">
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                  <button
                                    key={rate}
                                    onClick={() => {
                                      setPlaybackRate(rate);
                                      setShowSpeedMenu(false);
                                      toast.success(`Speed: ${rate}x`, {
                                        duration: 1400,
                                      });
                                    }}
                                    className={`w-full rounded-lg px-4 py-2 text-sm flex items-center justify-between ${
                                      state.playbackRate === rate
                                        ? "bg-primary/90 text-primary-foreground font-medium"
                                        : "hover:bg-white/10"
                                    }`}
                                  >
                                    <span>{rate}x</span>
                                    {state.playbackRate === rate && (
                                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Add to Playlist */}
                          <button
                            onClick={() => setShowAddToPlaylistDialog(true)}
                            className="relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-white/10 active:scale-95"
                            aria-label="Add to playlist"
                          >
                            <Plus className="h-5 w-5 text-muted-foreground" />
                          </button>
                        </>
                      ) : (
                        <AudioActionButtonsSkeleton />
                      )}
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  {!audio ? (
                    <AudioProgressSkeleton />
                  ) : (
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
                  )}

                  {/* PLAYBACK CONTROLS */}
                  {!audio ? (
                    <AudioPlaybackControlsSkeleton />
                  ) : (
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={previous}
                        className="player-control"
                        aria-label="Previous"
                        disabled={state.isLoading}
                      >
                        <SkipBack className="h-6 w-6" />
                      </button>

                      <button
                        onClick={handlePlayPause}
                        className="player-play"
                        aria-label="Play or pause"
                        disabled={state.isLoading}
                      >
                        {state.isLoading ? (
                          <div className="h-7 w-7 rounded-full border-2 border-primary-foreground/50 border-t-primary-foreground animate-spin" />
                        ) : state.isPlaying ? (
                          <Pause className="h-7 w-7 fill-current text-primary-foreground" />
                        ) : (
                          <Play className="ml-0.5 h-7 w-7 fill-current text-primary-foreground" />
                        )}
                      </button>

                      <button
                        onClick={next}
                        className="player-control"
                        aria-label="Next"
                        disabled={state.isLoading}
                      >
                        <SkipForward className="h-6 w-6" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Playlist Section */}
                <div className="glass-panel rounded-2xl overflow-hidden transition-all duration-300">
                  {/* Header – always visible, clickable to toggle */}
                  <button
                    onClick={toggleExpand}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                    aria-label={
                      isExpanded ? "Collapse playlist" : "Expand playlist"
                    }
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ListMusic className="h-5 w-5 text-primary shrink-0" />

                      {/* Marquee effect for long playlist name when collapsed */}
                      <div className="relative overflow-hidden flex-1">
                        <div
                          className={`text-sm font-medium text-left whitespace-nowrap ${
                            !isExpanded &&
                            (state.playlistName?.length ?? 0) > 25
                              ? "animate-marquee inline-block"
                              : ""
                          }`}
                        >
                          {state.playlistName || "Playlist"}
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
                          {/* Spacer for smooth loop */}
                          {state.playlistName || "Playlist"}
                        </div>
                      </div>

                      {state.playlistSource === "day" && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {/* Day/month if needed */}
                        </span>
                      )}
                    </div>

                    {localPlaylist.length > 0 && (
                      <div className="shrink-0">
                        {isExpanded ? (
                          <Minimize2 className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Maximize2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Expandable content */}
                  <div
                    className={`transition-all duration-400 ease-in-out overflow-hidden ${
                      isExpanded
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-4 pb-4">
                      {/* Queue length or empty message */}
                      {state.playlistSource === "search" &&
                        localPlaylist.length > 0 && (
                          <p className="text-xs text-muted-foreground mb-3">
                            {localPlaylist.length} search results
                          </p>
                        )}

                      {localPlaylist.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center italic">
                          {state.playlistSource === "search"
                            ? "No search results"
                            : state.playlistSource === "day"
                              ? "No tracks for this day"
                              : "Playlist is empty – add some tracks!"}
                        </p>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={localPlaylist.map((a) => a.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                              {localPlaylist.map((playlistAudio, index) => {
                                const isCurrent =
                                  state.currentAudio?.id === playlistAudio.id;
                                const isPlaying = isCurrent && state.isPlaying;

                                return (
                                  <SortableItem
                                    key={playlistAudio.id}
                                    audio={playlistAudio}
                                    index={index}
                                    isCurrent={isCurrent}
                                    isPlaying={isPlaying}
                                    state={state}
                                    play={play}
                                    removeFromPlaylist={removeFromPlaylist}
                                  />
                                );
                              })}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSharePreview && sharePreviewData && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-[480px] max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl bg-card/80 border border-white/10 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-card/70 backdrop-blur-sm border-b border-white/10">
              <h3 className="text-lg font-semibold text-black truncate">
                Share Preview
              </h3>
              <button
                onClick={() => {
                  setShowSharePreview(false);
                  setSharePreviewData(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-white/80" />
              </button>
            </div>

            {/* Image / Preview */}
            <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
              {sharePreviewData.previewUrl ? (
                <img
                  src={sharePreviewData.previewUrl}
                  alt="Share preview"
                  className="w-full h-auto max-h-[70vh] rounded-2xl object-contain shadow-lg"
                  onError={() => {
                    setSharePreviewData((prev) =>
                      prev ? { ...prev, previewUrl: null } : null,
                    );
                    toast.error("Preview failed to load");
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-[400px] rounded-2xl bg-black/30 border border-white/10 text-white/70 p-6">
                  <Music2 className="h-16 w-16 mb-4 opacity-40" />
                  <p className="text-lg font-semibold mb-1 truncate">
                    {audio?.title || "Track"}
                  </p>
                  <p className="text-sm opacity-80 mb-1 truncate">
                    {state.playlistName || "Playlist"}
                  </p>
                  <p className="text-xs opacity-60">Play on መዝገበ ስብሐት</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 p-4 border-t border-white/10">
              <button
                onClick={async () => {
                  setShowSharePreview(false);
                  setSharePreviewData(null);

                  try {
                    if (sharePreviewData.previewUrl) {
                      const blob = await fetch(
                        sharePreviewData.previewUrl,
                      ).then((r) => r.blob());
                      const file = new File([blob], "now-playing-mezmure.png", {
                        type: "image/png",
                      });

                      if (
                        navigator.canShare &&
                        navigator.canShare({ files: [file] })
                      ) {
                        await navigator.share({
                          title: audio?.title || "Now Playing",
                          text: sharePreviewData.shareText,
                          url: sharePreviewData.shareUrl,
                          files: [file],
                        });
                        toast.success("Shared with card! 🎵");
                        return;
                      }
                    }

                    if (navigator.share) {
                      await navigator.share({
                        title: audio?.title || "Now Playing",
                        text: sharePreviewData.shareText,
                        url: sharePreviewData.shareUrl,
                      });
                      toast.success("Shared!");
                    } else {
                      await copy(sharePreviewData.fullMessage);
                      toast.success("Link copied to clipboard!");
                    }
                  } catch (err) {
                    console.error("Final share failed:", err);
                    toast.error("Share failed — link copied instead");
                    await copy(sharePreviewData.fullMessage);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-base"
              >
                <Share2 className="h-5 w-5" />
                Share Now
              </button>

              <button
                onClick={() => {
                  setShowSharePreview(false);
                  setSharePreviewData(null);
                }}
                className="flex-1 py-3 rounded-xl text-base bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {audio && (
        <AddToPlaylistDialog
          audio={audio}
          isOpen={showAddToPlaylistDialog}
          onClose={() => setShowAddToPlaylistDialog(false)}
        />
      )}
    </>
  );
}
