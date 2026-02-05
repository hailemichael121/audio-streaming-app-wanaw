'use client';

import React from 'react';
import { Play, Pause, X } from 'lucide-react';
import { useAudioPlayer } from '@/lib/AudioContext';
import { getMonthName } from '@/lib/audioDataService';
import type { Audio } from '@/lib/types';

interface SearchResultsProps {
  results: Audio[];
  onClose: () => void;
  isVisible: boolean;
}

export default function SearchResults({
  results,
  onClose,
  isVisible,
}: SearchResultsProps) {
  const { state, play, pause } = useAudioPlayer();

  if (!isVisible) return null;

  const handlePlayAudio = (e: React.MouseEvent, audio: Audio) => {
    e.stopPropagation();
    if (state.currentAudio?.id === audio.id && state.isPlaying) {
      pause();
    } else {
      play(audio);
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Backdrop - above player (z-50) so modal is clearly on top */}
      <div
        className="fixed inset-0 bg-black/50 z-[55]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - sits above fixed player bar, with bottom margin */}
      <div className="fixed inset-0 z-[60] flex items-end pointer-events-none">
        <div
          className="w-full bg-card rounded-t-2xl shadow-2xl max-h-[75svh] overflow-hidden flex flex-col pointer-events-auto mb-24 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-card">
            <div>
              <h2 className="font-semibold text-card-foreground">Search Results</h2>
              <p className="text-xs text-muted-foreground">
                {results.length} {results.length === 1 ? 'result' : 'results'} found
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 active:opacity-70 transition-opacity rounded-lg hover:bg-muted/50"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Results List - extra padding at bottom so last item clears player */}
          <div className="overflow-y-auto flex-1 pb-6">
            {results.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No results found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {results.map((audio) => {
                  const isCurrent = state.currentAudio?.id === audio.id;
                  const isPlaying = isCurrent && state.isPlaying;
                  return (
                    <button
                      key={audio.id}
                      type="button"
                      onClick={(e) => handlePlayAudio(e, audio)}
                      className="w-full text-left p-4 flex items-center gap-3 active:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium truncate ${
                            isCurrent ? 'text-primary' : 'text-card-foreground'
                          }`}
                        >
                          {audio.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getMonthName(audio.month)}
                        </p>
                        {isCurrent && (
                          <div className="flex gap-1 mt-2">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{
                                  width: `${(state.currentTime / (state.duration || 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDuration(audio.duration)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
