"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Download,
  Search,
  X,
  Disc3,
  ListMusic,
  Loader2,
} from "lucide-react";
import { searchAudios, getMonths } from "@/lib/audioDataService";
import SearchResults from "@/components/SearchResults";
import PlaylistManager from "@/components/PlaylistManager";
import { useAudioPlayer } from "@/lib/AudioContext";
import type { Audio } from "@/lib/types";

const MONTHS = getMonths();

export default function MonthScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Audio[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);
  const [playlistCount, setPlaylistCount] = useState(0);
  const { state } = useAudioPlayer();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load playlist count on client side only
  useEffect(() => {
    const saved = localStorage.getItem("playlists");
    if (saved) {
      try {
        const playlists = JSON.parse(saved);
        setPlaylistCount(playlists.length);
      } catch (err) {
        console.error("Error parsing playlists:", err);
        setPlaylistCount(0);
      }
    }
  }, []);

  const runSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate a slight delay for better UX
    setTimeout(() => {
      const results = searchAudios(query, 10); // Limit to 10 results for suggestions
      setSearchResults(results);
      setIsSearching(false);
    }, 150);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        runSearch(query);
      }, 300);
    },
    [runSearch],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null; // Clear the reference
    }
  }, []);

  const handleCloseResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  return (
    <main className="mobile-shell min-h-svh pb-40 text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/75 backdrop-blur-2xl">
        <div className="mx-auto max-w-2xl p-4">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                mezgebe sbhat
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse and play spiritual tracks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPlaylistManager(true)}
                className="glass-chip flex items-center gap-1 px-2 py-2 text-xs"
                aria-label="Playlists"
              >
                <ListMusic className="h-4 w-4" />
                <span>{playlistCount}</span>
              </button>
              <Link
                href="/downloads"
                className="glass-chip p-2"
                aria-label="Downloads"
              >
                <Download className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <form
              className="glass-panel flex items-center gap-2 px-3 py-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  runSearch(searchQuery);
                }
              }}
            >
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search songs, month, title..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-transparent text-sm outline-none"
                aria-label="Search audio tracks"
              />
              {searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  type="button"
                  className="glass-chip p-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              {isSearching && (
                <div className="px-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </form>

            {/* Search Results Suggestions */}
            <div className="relative">
              <SearchResults
                results={searchResults}
                onClose={handleCloseResults}
                isVisible={searchResults.length > 0}
                inputRef={searchInputRef}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {MONTHS.map((month) => (
          <Link
            key={month.number}
            href={`/day?month=${month.number}`}
            className="group"
          >
            <article className="glass-card h-full p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Disc3 className="h-5 w-5" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold">{month.name}</h2>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </article>
          </Link>
        ))}
      </div>

      <PlaylistManager
        isOpen={showPlaylistManager}
        onClose={() => setShowPlaylistManager(false)}
      />
    </main>
  );
}
