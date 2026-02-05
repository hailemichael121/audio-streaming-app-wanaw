'use client';

import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ChevronUp } from 'lucide-react';
import { useAudioPlayer } from '@/lib/AudioContext';
import { Spinner } from '@/components/ui/spinner';

export default function AudioPlayer() {
  const { state, play, pause, resume, seek } = useAudioPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlayPause = () => {
    if (!state.currentAudio) return;

    if (state.isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!state.currentAudio) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-50">
      {/* Player container */}
      <div className="px-4 py-3 space-y-3">
        {/* Song info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-card-foreground text-sm truncate">
              {state.currentAudio.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {state.isLoading ? 'Loading...' : state.isPlaying ? 'Playing' : 'Paused'}
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="active:opacity-70 p-2"
            aria-label="Toggle player"
          >
            <ChevronUp
              className={`w-5 h-5 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={state.duration || 0}
            value={state.currentTime}
            onChange={handleProgressChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="w-full h-1.5 bg-muted rounded-full cursor-pointer appearance-none accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(state.currentTime)}</span>
            <span>{formatTime(state.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Previous button */}
          <button
            onClick={() => {
              // Previous functionality handled by parent
            }}
            className="flex-1 h-12 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors active:bg-primary/20"
            type="button"
            aria-label="Previous track"
          >
            <SkipBack className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Play/Pause button - larger, primary action */}
          <button
            onClick={handlePlayPause}
            disabled={state.isLoading}
            className="flex-1 h-12 flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 transition-colors active:bg-primary/80 disabled:opacity-90 disabled:cursor-wait"
            type="button"
            aria-label={state.isLoading ? 'Loading' : state.isPlaying ? 'Pause' : 'Play'}
          >
            {state.isLoading ? (
              <Spinner className="w-6 h-6 text-primary-foreground" />
            ) : state.isPlaying ? (
              <Pause className="w-6 h-6 text-primary-foreground fill-current" />
            ) : (
              <Play className="w-6 h-6 text-primary-foreground fill-current ml-0.5" />
            )}
          </button>

          {/* Next button */}
          <button
            onClick={() => {
              // Next functionality handled by parent
            }}
            className="flex-1 h-12 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors active:bg-primary/20"
            type="button"
            aria-label="Next track"
          >
            <SkipForward className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Volume indicator */}
          <div className="flex-1 h-12 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
