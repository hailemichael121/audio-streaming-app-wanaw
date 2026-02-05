"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAudioPlayer } from "@/lib/AudioContext";

export function AudioArtworkCard({
  artworkImage,
  title = "",
  subtitle = "",
  isLoading = false,
  ...props
}: {
  artworkImage: string | null;
  title?: string | null;
  subtitle?: string | null;
  isLoading?: boolean;
}) {
  const [bgColor, setBgColor] = useState<string>("#1a1a1a");
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [showSwipeHint, setShowSwipeHint] = useState<boolean>(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwipingHorizontal = useRef<boolean>(false);

  const { next, previous } = useAudioPlayer();

  // Hide swipe hint after first interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Pure canvas average color extraction
  const getAverageColor = (img: HTMLImageElement): string => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return "#1a1a1a";

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let r = 0,
      g = 0,
      b = 0;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    const count = len / 4;
    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    return `rgb(${r}, ${g}, ${b})`;
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!artworkImage || !img || isLoading) return;

    if (img.complete && img.naturalWidth > 0) {
      try {
        setBgColor(getAverageColor(img));
      } catch (err) {
        console.warn("Average color failed", err);
      }
      return;
    }

    const onLoad = () => {
      try {
        setBgColor(getAverageColor(img));
      } catch (err) {
        console.warn("Average color failed on load", err);
      }
    };

    img.addEventListener("load", onLoad);
    return () => img.removeEventListener("load", onLoad);
  }, [artworkImage, isLoading]);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const x =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const y =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      touchStartX.current = x;
      touchStartY.current = y;
      setIsSwiping(true);
      isSwipingHorizontal.current = false;
      setSwipeDirection(null);
    },
    [],
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isSwiping) return;

      e.preventDefault();
      const x =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const y =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const deltaX = x - touchStartX.current;
      const deltaY = y - touchStartY.current;

      // Determine if this is a horizontal swipe (minimal vertical movement)
      if (
        !isSwipingHorizontal.current &&
        Math.abs(deltaX) > 10 &&
        Math.abs(deltaY) < Math.abs(deltaX) * 0.5
      ) {
        isSwipingHorizontal.current = true;
      }

      if (isSwipingHorizontal.current) {
        // Limit swipe distance to prevent excessive movement
        const maxSwipe = 150;
        const clampedDeltaX = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));

        setSwipeOffset(clampedDeltaX);

        // Set direction for visual feedback
        if (clampedDeltaX > 20) {
          setSwipeDirection("right");
        } else if (clampedDeltaX < -20) {
          setSwipeDirection("left");
        } else {
          setSwipeDirection(null);
        }
      }
    },
    [isSwiping],
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isSwiping || !isSwipingHorizontal.current) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }

    const swipeThreshold = 80; // Minimum distance to trigger navigation
    const velocity = Math.abs(swipeOffset) / 10; // Simple velocity calculation

    // If swipe is far enough or fast enough, trigger navigation
    if (Math.abs(swipeOffset) > swipeThreshold || velocity > 15) {
      if (swipeOffset > 0) {
        // Swipe right - go to previous track
        previous();
      } else {
        // Swipe left - go to next track
        next();
      }

      // Visual feedback animation
      const direction = swipeOffset > 0 ? 1 : -1;
      const exitDistance = 300;

      // Animate exit
      setSwipeOffset(exitDistance * direction);

      // Reset after animation
      setTimeout(() => {
        setSwipeOffset(0);
        setIsSwiping(false);
      }, 300);
    } else {
      // Return to original position
      const returnAnimation = () => {
        let currentOffset = swipeOffset;
        const step = () => {
          currentOffset = currentOffset * 0.7; // Damping effect
          setSwipeOffset(currentOffset);

          if (Math.abs(currentOffset) > 1) {
            requestAnimationFrame(step);
          } else {
            setSwipeOffset(0);
            setIsSwiping(false);
          }
        };
        requestAnimationFrame(step);
      };

      returnAnimation();
    }

    // Hide swipe hint after first successful swipe
    setShowSwipeHint(false);
  }, [isSwiping, swipeOffset, next, previous]);

  // Add mouse events for desktop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleTouchStart(e);
      document.addEventListener("mousemove", handleMouseMove as any);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleTouchStart],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleTouchMove({ clientX: e.clientX, clientY: e.clientY } as any);
    },
    [handleTouchMove],
  );

  const handleMouseUp = useCallback(() => {
    document.removeEventListener("mousemove", handleMouseMove as any);
    document.removeEventListener("mouseup", handleMouseUp);
    handleTouchEnd();
  }, [handleMouseMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] rounded-[1.5rem] overflow-hidden border border-white/20 shadow-2xl select-none touch-none cursor-grab active:cursor-grabbing"
      style={{
        backgroundColor: bgColor,
        transform: `translateX(${swipeOffset}px)`,
        transition: isSwiping
          ? "none"
          : "transform 0.3s cubic-bezier(0.2, 0.8, 0.4, 1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {/* Minimal Swipe Indicators - Only show during swipe */}
      {isSwiping && (
        <>
          {/* Left indicator (Previous) - subtle arrow */}
          <div
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-all duration-200 ${
              swipeDirection === "right" ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <div className="text-white font-bold text-lg">←</div>
            </div>
          </div>

          {/* Right indicator (Next) - subtle arrow */}
          <div
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 transition-all duration-200 ${
              swipeDirection === "left" ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <div className="text-white font-bold text-lg">→</div>
            </div>
          </div>
        </>
      )}

      {/* Initial Swipe Hint - Only shows for 3 seconds */}
      {showSwipeHint && !isSwiping && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Hint dots on edges */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse-slow" />
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse-slow" />
          </div>
        </div>
      )}

      {/* Visual feedback during swipe */}
      {isSwiping && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className={`absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-black/40 to-transparent transition-opacity duration-200 ${
              swipeOffset > 0 ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-black/40 to-transparent transition-opacity duration-200 ${
              swipeOffset < 0 ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      )}

      <div className="relative aspect-square w-full">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Spinner className="h-12 w-12 text-white/80" />
            {/* Loading text overlay - minimal */}
            {title && (
              <div className="absolute bottom-5 left-5 right-5 text-center">
                <p className="text-white/70 text-sm font-medium truncate">
                  Loading "{title}"...
                </p>
              </div>
            )}
          </div>
        ) : artworkImage ? (
          <>
            <img
              ref={imgRef}
              src={artworkImage}
              alt="Audio Artwork"
              className="absolute inset-0 h-full w-full object-contain"
              crossOrigin="anonymous"
              decoding="async"
              style={{
                transform: `scale(${1 - Math.abs(swipeOffset) / 1000})`,
                transition: isSwiping ? "none" : "transform 0.3s ease",
              }}
            />
            {/* Title and Subtitle overlay when artwork is present */}
            <div className="absolute inset-x-0 bottom-0 p-5 pb-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none">
              {title && (
                <h2 className="text-white text-lg font-semibold truncate mb-1">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-white/80 text-sm truncate">{subtitle}</p>
              )}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/80 to-accent/70">
            <div className="text-white/70 text-6xl opacity-40 mb-4">♪</div>
            {title && (
              <div className="px-4 text-center">
                <h2 className="text-white text-lg font-semibold mb-1 truncate max-w-full">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-white/80 text-sm truncate">{subtitle}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Top fade overlay for better text readability */}
        {!isLoading && (
          <>
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
          </>
        )}

        {/* Swipe progress bar - minimal */}
        {isSwiping && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/70 transition-all duration-100"
              style={{
                width: `${Math.min(100, Math.abs(swipeOffset) / 1.5)}%`,
                transform: `translateX(${swipeOffset > 0 ? "0%" : "100%"})`,
                transformOrigin: swipeOffset > 0 ? "left" : "right",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
