// Core type definitions for the Ethiopian Orthodox Church music app

export interface Audio {
  id: string;
  title: string;
  filename: string;
  month: number; // 1-12
  day: number;
  url: string;
  duration?: number;
  localPath?: string; // Path for offline downloaded file
}
export type PlaylistSource = "queue" | "search" | "day" | "playlist";
export interface Month {
  id: number;
  name: string;
  number: number; // 1-12
}

/** A part (category) within a month; each part has an array of songs */
export interface MonthPart {
  id: number;
  name: string;
  songs: Audio[];
}

/** Month constant with its parts and songs (Ethiopian calendar) */
export interface MonthWithParts {
  id: number;
  name: string;
  parts: MonthPart[];
}

export interface DownloadProgress {
  audioId: string;
  filename: string;
  progress: number; // 0-100
  status: "pending" | "downloading" | "completed" | "failed";
}

export interface PlayerState {
  currentAudio: Audio | null;
  queue: Audio[];
  currentIndex: number;
  playlist: Audio[]; // Current playlist/queue to display
  playlistName: string; // Dynamic playlist name based on source
  playlistSource: "queue" | "search" | "day" | "playlist"; // Where the playlist came from
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0-1
  isLooping: boolean;
  playbackRate: number;
  isOfflineMode: boolean;
}

export interface AudioPlayerContextType {
  state: PlayerState;
  play: (
    audio: Audio,
    queue?: Audio[],
    sourceName?: string,
    sourceType?: PlayerState["playlistSource"],
  ) => void;
  playFromDay: (audio: Audio, dayAudios: Audio[], dayName: string) => void;
  playFromSearch: (audio: Audio, searchResults: Audio[]) => void;
  playFromPlaylist: (
    audio: Audio,
    playlistAudios: Audio[],
    playlistName: string,
  ) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
  toggleLoop: () => void;
  setPlaybackRate: (rate: number) => void;
  addToPlaylist: (audio: Audio) => void;
  removeFromPlaylist: (audioId: string) => void;
  setPlaylistName: (name: string) => void;
  setOfflineMode: (offline: boolean) => void;
}

export interface OfflineFile {
  audioId: string;
  filename: string;
  localPath: string;
  size: number;
  downloadedAt: number; // timestamp
}
