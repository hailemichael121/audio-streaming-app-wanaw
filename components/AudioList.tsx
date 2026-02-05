'use client';

import { Play } from 'lucide-react';

interface Audio {
  id: string;
  title: string;
  url: string;
}

interface AudioListProps {
  audios: Audio[];
  currentAudio: Audio | null;
  onSelectAudio: (audio: Audio) => void;
}

export default function AudioList({
  audios,
  currentAudio,
  onSelectAudio,
}: AudioListProps) {
  return (
    <div className="divide-y divide-border">
      {audios.map((audio) => {
        const isPlaying = currentAudio?.id === audio.id;

        return (
          <button
            key={audio.id}
            onClick={() => onSelectAudio(audio)}
            className={`w-full px-4 py-4 sm:px-6 text-left transition-colors active:bg-muted/50 ${
              isPlaying
                ? 'bg-primary/5 border-l-4 border-primary'
                : 'bg-background hover:bg-muted/30'
            }`}
            type="button"
          >
            <div className="flex items-center gap-3">
              {/* Play icon indicator */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isPlaying
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
              </div>

              {/* Audio info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium truncate ${
                    isPlaying ? 'text-primary' : 'text-card-foreground'
                  }`}
                >
                  {audio.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isPlaying ? 'Now playing' : 'Tap to play'}
                </p>
              </div>

              {/* Chevron indicator */}
              <div className="flex-shrink-0 text-muted-foreground">
                {'›'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
