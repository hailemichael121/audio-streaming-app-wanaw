"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Download, Search, X } from "lucide-react";
import { searchAudios, getMonths } from "@/lib/audioDataService";
import SearchResults from "@/components/SearchResults";
import type { Audio } from "@/lib/types";

const MONTHS = getMonths();

export default function MonthScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<Audio[]>([]);

  // Search audios as user types
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchAudios(query, 50);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleCloseResults = useCallback(() => {
    setIsSearchActive(false);
  }, []);

  return (
    <main className="min-h-svh bg-background text-foreground pb-20">
      {/* Header with Search */}
      <header className="sticky top-0 z-20 bg-primary text-primary-foreground shadow-sm">
        <div className="p-4 flex items-start justify-between gap-2">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Ethiopian Orthodox Music</h1>
            <p className="text-sm opacity-90 mt-1">Select a month to browse</p>
          </div>
          <Link
            href="/downloads"
            className="active:opacity-70 p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors shrink-0"
            aria-label="Downloads"
          >
            <Download className="w-6 h-6" />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-primary-foreground/60 shrink-0" />
            <input
              type="text"
              placeholder="Search audios..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchActive(true)}
              className="flex-1 bg-transparent text-primary-foreground placeholder-primary-foreground/50 outline-none text-sm min-w-0"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="active:opacity-70 p-1"
                aria-label="Clear search"
              >
                <X className="w-5 h-5 text-primary-foreground/60" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Month Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 auto-rows-max">
        {MONTHS.map((month) => (
          <Link
            key={month.number}
            href={`/day?month=${month.number}`}
            className="block group"
          >
            <div className="bg-card border border-border rounded-lg p-4 transition-all duration-200 active:scale-95 cursor-pointer hover:bg-secondary/10">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-card-foreground">
                    {month.name}
                  </h2>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-active:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Search Results Modal */}
      <SearchResults
        results={searchResults}
        onClose={handleCloseResults}
        isVisible={isSearchActive && searchQuery.trim().length > 0}
      />
    </main>
  );
}
