"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Search, X } from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioContext";
import { getAudios, getMonthName, getPartsForMonth } from "@/lib/audioDataService";
import type { Audio } from "@/lib/types";

export default function AudioListScreen() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const partParam = searchParams.get("part");
  const dayParam = searchParams.get("day");
  const categoryParam = searchParams.get("category");

  const monthNumber = monthParam ? parseInt(monthParam) : 1;
  const partNumber = partParam ? parseInt(partParam) : dayParam ? parseInt(dayParam) : 1;
  const categoryId = categoryParam || "one";

  const monthName = getMonthName(monthNumber);
  const parts = getPartsForMonth(monthNumber);
  const currentPart = parts.find((p) => p.id === partNumber);
  const partName = currentPart?.name ?? `Part ${partNumber}`;

  const [audios, setAudios] = useState<Audio[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { state, play, pause } = useAudioPlayer();

  // Load audios from month constants (month + part) or legacy month/day/category
  useEffect(() => {
    const loadedAudios = getAudios(monthNumber, partNumber, categoryId);
    setAudios(loadedAudios);
  }, [monthNumber, partNumber, categoryId]);

  // Filter audios based on search query (debounced)
  const filteredAudios = useMemo(() => {
    if (!searchQuery.trim()) return audios;

    const query = searchQuery.toLowerCase();
    return audios.filter((audio) => audio.title.toLowerCase().includes(query));
  }, [audios, searchQuery]);

  const handlePlayAudio = useCallback(
    (audio: Audio) => {
      if (state.currentAudio?.id === audio.id && state.isPlaying) {
        pause();
      } else if (state.currentAudio?.id === audio.id) {
        // Resume same audio
      } else {
        play(audio);
      }
    },
    [state.currentAudio, state.isPlaying, play, pause],
  );

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-svh bg-background text-foreground pb-24">
      {/* Header: title or inline search in same bar (matches player bar style) */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <Link
            href={`/day?month=${monthNumber}`}
            className="active:opacity-70 flex-shrink-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          {isSearchOpen ? (
            <>
              <div className="flex-1 min-w-0 flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-3 py-2">
                <Search className="w-5 h-5 text-primary-foreground/60 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search in this part..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-primary-foreground placeholder-primary-foreground/60 outline-none text-sm min-w-0"
                />
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  handleClearSearch();
                }}
                className="active:opacity-70 p-2 flex-shrink-0"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate">
                  {monthName} - {partName}
                </h1>
                <p className="text-xs opacity-90 truncate">
                  {filteredAudios.length === audios.length
                    ? `${audios.length} songs`
                    : `${filteredAudios.length} of ${audios.length} songs`}
                </p>
              </div>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="active:opacity-70 p-2 flex-shrink-0"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Audio List */}
      <div className="divide-y divide-border">
        {filteredAudios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-muted-foreground text-center">
              {searchQuery ? "No audios found" : "No audios available"}
            </p>
          </div>
        ) : (
          filteredAudios.map((audio) => {
            const isCurrentAudio = state.currentAudio?.id === audio.id;
            const isPlaying = isCurrentAudio && state.isPlaying;

            return (
              <button
                key={audio.id}
                onClick={() => handlePlayAudio(audio)}
                className="w-full text-left p-4 active:bg-muted transition-colors flex items-start gap-3 active:scale-100"
              >
                {/* Play/Pause Button */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCurrentAudio
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </div>

                {/* Audio Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold text-sm truncate ${
                      isCurrentAudio ? "text-accent" : "text-card-foreground"
                    }`}
                  >
                    {audio.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDuration(audio.duration)}
                  </p>
                  {isCurrentAudio && (
                    <div className="flex gap-1 mt-2">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{
                            width: `${
                              (state.currentTime / (state.duration || 1)) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </main>
  );
}
