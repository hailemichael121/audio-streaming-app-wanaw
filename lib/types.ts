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
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0-1
  isOfflineMode: boolean;
}

export interface AudioPlayerContextType {
  state: PlayerState;
  play: (audio: Audio) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  next: (audios: Audio[]) => void;
  previous: (audios: Audio[]) => void;
  setOfflineMode: (offline: boolean) => void;
}

export interface OfflineFile {
  audioId: string;
  filename: string;
  localPath: string;
  size: number;
  downloadedAt: number; // timestamp
}
