"use client";

import React, { useEffect, useRef } from "react";
import { Play, Pause, Music2 } from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioContext";
import { getMonthName } from "@/lib/audioDataService";
import type { Audio } from "@/lib/types";

interface SearchResultsProps {
  results: Audio[];
  onClose: () => void;
  isVisible: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function SearchResults({
  results,
  onClose,
  isVisible,
  inputRef,
}: SearchResultsProps) {
  const { state, playFromSearch, pause, resume } = useAudioPlayer();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        inputRef?.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isVisible, onClose, inputRef]);

  if (!isVisible || results.length === 0) return null;

  const handlePlayAudio = (e: React.MouseEvent, audio: Audio) => {
    e.stopPropagation();
    if (state.currentAudio?.id === audio.id && state.isPlaying) {
      pause();
    } else if (state.currentAudio?.id === audio.id) {
      resume();
    } else {
      playFromSearch(audio, results);
    }
    onClose();
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/20 bg-card/95 shadow-2xl backdrop-blur-xl"
      style={{
        maxHeight: "calc(100vh - 200px)",
        overflowY: "auto",
      }}
    >
      <div className="p-2">
        <div className="mb-2 px-3 pt-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            {results.length} results found
          </h3>
        </div>

        <div className="space-y-1">
          {results.map((audio) => {
            const isCurrent = state.currentAudio?.id === audio.id;
            const isPlaying = isCurrent && state.isPlaying;

            return (
              <button
                key={audio.id}
                type="button"
                onClick={(e) => handlePlayAudio(e, audio)}
                className="w-full rounded-lg p-3 text-left transition-colors hover:bg-white/5 active:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/90 to-accent/80 text-primary-foreground">
                    <Music2 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3
                          className={`truncate text-sm font-medium ${isCurrent ? "text-primary" : "text-card-foreground"}`}
                        >
                          {audio.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {getMonthName(audio.month)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(audio.duration)}
                        </span>
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${isCurrent ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground"}`}
                        >
                          {isPlaying ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="ml-0.5 h-3.5 w-3.5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${
                              (state.currentTime / (state.duration || 1)) * 100
                            }%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-2 border-t border-white/10 pt-2">
          <button
            onClick={onClose}
            className="w-full rounded-lg p-2 text-center text-xs text-muted-foreground hover:bg-white/5"
          >
            Close suggestions
          </button>
        </div>
      </div>
    </div>
  );
}
