import type { Audio } from './types';

const PLAYLISTS_KEY = 'mezgebe-playlists-v1';

export interface Playlist {
  id: string;
  name: string;
  audios: Audio[];
  createdAt: number;
  updatedAt: number;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function persist(playlists: Playlist[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export function getPlaylists(): Playlist[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    return raw ? (JSON.parse(raw) as Playlist[]) : [];
  } catch {
    return [];
  }
}

export function createPlaylist(name: string): Playlist {
  const now = Date.now();
  const playlist: Playlist = {
    id: `pl-${now}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || 'New Playlist',
    audios: [],
    createdAt: now,
    updatedAt: now,
  };

  const next = [playlist, ...getPlaylists()];
  persist(next);
  return playlist;
}

export function renamePlaylist(playlistId: string, name: string): Playlist[] {
  const cleanName = name.trim();
  const next = getPlaylists().map((playlist) =>
    playlist.id === playlistId
      ? { ...playlist, name: cleanName || playlist.name, updatedAt: Date.now() }
      : playlist,
  );
  persist(next);
  return next;
}

export function deletePlaylist(playlistId: string): Playlist[] {
  const next = getPlaylists().filter((playlist) => playlist.id !== playlistId);
  persist(next);
  return next;
}

export function addAudioToPlaylist(playlistId: string, audio: Audio): Playlist[] {
  const next = getPlaylists().map((playlist) => {
    if (playlist.id !== playlistId) return playlist;

    if (playlist.audios.some((item) => item.id === audio.id)) {
      return playlist;
    }

    return {
      ...playlist,
      audios: [...playlist.audios, audio],
      updatedAt: Date.now(),
    };
  });

  persist(next);
  return next;
}

export function removeAudioFromPlaylist(playlistId: string, audioId: string): Playlist[] {
  const next = getPlaylists().map((playlist) =>
    playlist.id === playlistId
      ? {
          ...playlist,
          audios: playlist.audios.filter((audio) => audio.id !== audioId),
          updatedAt: Date.now(),
        }
      : playlist,
  );
  persist(next);
  return next;
}

export function getPlaylistById(playlistId: string): Playlist | null {
  return getPlaylists().find((playlist) => playlist.id === playlistId) ?? null;
}
