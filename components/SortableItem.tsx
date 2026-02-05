// SortableItem.tsx - Fixed drag vs scroll conflict

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRef, useState, useEffect } from "react";

export function SortableItem({
  audio,
  index,
  isCurrent,
  isPlaying,
  state,
  play,
  removeFromPlaylist,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: audio.id });

  const dragHandleRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [isTouchMoving, setIsTouchMoving] = useState(false);
  const [isDragAttempt, setIsDragAttempt] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.75 : 1,
    zIndex: isDragging ? 10 : 1,
    touchAction: isDragging ? "none" : "pan-y", // Allow vertical scrolling when not dragging
  };

  // Handle touch start - prevent default to stop scrolling when dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsTouchMoving(false);
    setIsDragAttempt(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging || isDragAttempt) {
      // If already dragging or attempting drag, prevent default to stop scroll
      e.preventDefault();
    }

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);

    // If horizontal movement is greater than vertical, it's likely a drag attempt
    if (deltaX > deltaY && deltaX > 10) {
      setIsDragAttempt(true);
    }

    // If we've moved significantly, mark as moving
    if (deltaX > 5 || deltaY > 5) {
      setIsTouchMoving(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);

    // If it was a tap (not a drag), trigger play
    if (!isTouchMoving && deltaX < 10 && deltaY < 10) {
      play(audio, state.playlist, state.playlistName, state.playlistSource);
    }
  };

  // Handle long press for drag on mobile
  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      // Programmatically trigger drag on long press
      if (dragHandleRef.current) {
        setIsDragAttempt(true);
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          clientX: touchStart.x,
          clientY: touchStart.y,
        });
        dragHandleRef.current.dispatchEvent(event);
      }
    }, 400); // 400ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsDragAttempt(false);
  };

  // Prevent page scroll when dragging
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [isDragging]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-xl px-3 py-3.5 transition-all select-none touch-pan-y ${
        isCurrent
          ? "bg-primary/20 border border-primary/30"
          : "bg-background/50 hover:bg-background/70"
      } ${isDragging ? "shadow-2xl scale-[1.03] ring-2 ring-primary/40" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchCancel={handleLongPressEnd}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Drag handle - only triggers drag */}
        <div
          ref={dragHandleRef}
          className="flex items-center justify-center w-10 h-10 -ml-1 text-muted-foreground/70 cursor-grab active:cursor-grabbing touch-manipulation"
          {...attributes}
          {...listeners}
          onTouchStart={(e) => {
            e.stopPropagation();
            // Start long press detection
            handleLongPressStart();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handleLongPressEnd();
          }}
          onTouchCancel={handleLongPressEnd}
        >
          <GripVertical className="h-6 w-6" />
        </div>

        <span className="text-sm text-muted-foreground/80 w-6 text-right font-medium touch-none">
          {index + 1}
        </span>

        {/* Play area - tappable but not draggable */}
        <div
          className="flex-1 min-w-0 py-1 cursor-pointer touch-auto"
          onClick={() => {
            play(
              audio,
              state.playlist,
              state.playlistName,
              state.playlistSource,
            );
          }}
        >
          <p className="truncate text-sm font-medium leading-tight select-none">
            {audio.title}
            {isCurrent && (
              <span className="ml-2.5 text-xs text-primary font-semibold">
                {isPlaying ? "• Playing" : "• Paused"}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 touch-none">
        {state.playlistSource === "playlist" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFromPlaylist(audio.id);
              toast.success("Removed from playlist", {
                duration: 1500,
                position: "bottom-center",
              });
            }}
            aria-label={`Remove ${audio.title}`}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors touch-manipulation"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
