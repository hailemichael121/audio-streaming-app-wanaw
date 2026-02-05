"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Search, X, Music2, Plus } from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioContext";
import {
  getAudios,
  getMonthName,
  getPartsForMonth,
} from "@/lib/audioDataService";
import {
  addAudioToPlaylist,
  createPlaylist,
  getPlaylists,
  type Playlist,
} from "@/lib/playlistService";
import type { Audio } from "@/lib/types";

export default function AudioListScreen() {
  const searchParams = useSearchParams();
  const monthNumber = parseInt(searchParams.get("month") || "1", 10);
  const partNumber = parseInt(
    searchParams.get("part") || searchParams.get("day") || "1",
    10,
  );
  const categoryId = searchParams.get("category") || "one";

  const monthName = getMonthName(monthNumber);
  const parts = getPartsForMonth(monthNumber);
  const currentPart = parts.find((p) => p.id === partNumber);
  const partName = currentPart?.name || `Part ${partNumber}`;

  const [audios, setAudios] = useState<Audio[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectAudio, setSelectAudio] = useState<Audio | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const { state, playFromDay, pause, resume } = useAudioPlayer();

  useEffect(() => {
    setAudios(getAudios(monthNumber, partNumber, categoryId));
  }, [monthNumber, partNumber, categoryId]);

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
        resume();
      } else {
        // Play from this day's collection
        playFromDay(audio, filteredAudios, `${monthName} - ${partName}`);
      }
    },
    [
      state.currentAudio,
      state.isPlaying,
      pause,
      resume,
      playFromDay,
      filteredAudios,
      monthName,
      partName,
    ],
  );

  const openPlaylistPicker = (audio: Audio) => {
    setPlaylists(getPlaylists());
    setSelectAudio(audio);
  };

  return (
    <main className="mobile-shell min-h-svh pb-44 text-foreground">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto max-w-2xl p-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/day?month=${monthNumber}`}
              className="glass-chip p-2"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {isSearchOpen ? (
              <>
                <div className="glass-panel flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search in this part"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="glass-chip p-2"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-lg font-bold">
                    {monthName} · {partName}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {filteredAudios.length} of {audios.length} tracks
                  </p>
                </div>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="glass-chip p-2"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-3 p-4">
        {filteredAudios.map((audio) => {
          const isCurrent = state.currentAudio?.id === audio.id;
          const isPlaying = isCurrent && state.isPlaying;
          return (
            <div key={audio.id} className="glass-card w-full p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePlayAudio(audio)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-accent/80 text-primary-foreground shadow-md"
                  aria-label={`Play ${audio.title}`}
                >
                  <Music2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handlePlayAudio(audio)}
                  className="min-w-0 flex-1 text-left"
                >
                  <h3
                    className={`truncate text-sm font-semibold ${isCurrent ? "text-primary" : "text-card-foreground"}`}
                  >
                    {audio.title}
                  </h3>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPlaylistPicker(audio);
                  }}
                  className="glass-chip p-2"
                  aria-label="Add to playlist"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePlayAudio(audio)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectAudio && (
        <div
          className="fixed inset-0 z-[75] bg-black/50 p-4"
          onClick={() => setSelectAudio(null)}
        >
          <div
            className="mx-auto mt-20 max-w-md rounded-2xl border border-white/20 bg-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-semibold">
              Add "{selectAudio.title}" to playlist
            </h3>
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => {
                    addAudioToPlaylist(playlist.id, selectAudio);
                    setSelectAudio(null);
                  }}
                  className="glass-card w-full p-2 text-left text-sm"
                >
                  {playlist.name}
                </button>
              ))}
              <button
                onClick={() => {
                  const created = createPlaylist(
                    `Playlist ${playlists.length + 1}`,
                  );
                  addAudioToPlaylist(created.id, selectAudio);
                  setSelectAudio(null);
                }}
                className="glass-card w-full p-2 text-left text-sm"
              >
                + New playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
