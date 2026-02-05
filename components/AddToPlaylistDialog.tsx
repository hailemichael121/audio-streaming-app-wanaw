"use client";

import React, { useState, useEffect } from "react";
import { Plus, Check, Music2 } from "lucide-react";
import type { Audio } from "@/lib/types";
import toast from "react-hot-toast";

interface Playlist {
  id: string;
  name: string;
  audios: Audio[];
  created: number;
  updated: number;
}

interface AddToPlaylistDialogProps {
  audio: Audio;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddToPlaylistDialog({
  audio,
  isOpen,
  onClose,
  onSuccess,
}: AddToPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Check which playlists already contain this audio
      const saved = localStorage.getItem("playlists");
      if (saved) {
        const loadedPlaylists: Playlist[] = JSON.parse(saved);
        const alreadyIn = new Set<string>();
        loadedPlaylists.forEach((p) => {
          if (p.audios.some((a) => a.id === audio.id)) {
            alreadyIn.add(p.id);
          }
        });
        setSelectedPlaylists(alreadyIn);
      }
    }
  }, [isOpen, audio.id]);

  const loadPlaylists = () => {
    const saved = localStorage.getItem("playlists");
    if (saved) {
      setPlaylists(JSON.parse(saved));
    }
  };

  const togglePlaylistSelection = (playlistId: string) => {
    const updated = new Set(selectedPlaylists);
    if (updated.has(playlistId)) {
      updated.delete(playlistId);
    } else {
      updated.add(playlistId);
    }
    setSelectedPlaylists(updated);
  };

  const createNewPlaylistAndAdd = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName.trim(),
      audios: [audio],
      created: Date.now(),
      updated: Date.now(),
    };

    const updated = [...playlists, newPlaylist];
    localStorage.setItem("playlists", JSON.stringify(updated));

    setPlaylists(updated);
    setSelectedPlaylists(new Set([...selectedPlaylists, newPlaylist.id]));
    setNewPlaylistName("");
    setShowNewPlaylistForm(false);

    toast.success("Playlist created and track added!", {
      duration: 2000,
      position: "bottom-center",
      style: {
        background: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        borderRadius: "12px",
      },
    });
  };

  const saveSelections = () => {
    const saved = localStorage.getItem("playlists");
    if (saved) {
      const loadedPlaylists: Playlist[] = JSON.parse(saved);
      const updated = loadedPlaylists.map((playlist) => {
        const audioInPlaylist = playlist.audios.some((a) => a.id === audio.id);

        if (selectedPlaylists.has(playlist.id) && !audioInPlaylist) {
          // Add to playlist
          return {
            ...playlist,
            audios: [...playlist.audios, audio],
            updated: Date.now(),
          };
        } else if (!selectedPlaylists.has(playlist.id) && audioInPlaylist) {
          // Remove from playlist
          return {
            ...playlist,
            audios: playlist.audios.filter((a) => a.id !== audio.id),
            updated: Date.now(),
          };
        }
        return playlist;
      });

      localStorage.setItem("playlists", JSON.stringify(updated));
    }

    toast.success("Playlist updated successfully!", {
      duration: 2000,
      position: "bottom-center",
      style: {
        background: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        borderRadius: "12px",
      },
    });

    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-70"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-80 flex items-end p-2 pointer-events-none sm:items-center sm:justify-center">
        <div
          className="pointer-events-auto w-full max-w-md max-h-[70svh] flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-card/95 backdrop-blur-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">Add to Playlist</h2>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {audio.title}
            </p>
          </div>

          {/* Playlist List */}
          <div className="flex-1 overflow-y-auto p-4">
            {playlists.length === 0 && !showNewPlaylistForm ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="h-9 w-9 rounded-xl overflow-hidden mb-2">
                  <img
                    src="/images/Tsenatsl3.png"
                    alt="Disc"
                    className="h-full w-full object-cover"
                  />
                </div>{" "}
                <p>No playlists yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => togglePlaylistSelection(playlist.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 hover:border-primary/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{playlist.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {playlist.audios.length} tracks
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedPlaylists.has(playlist.id)
                          ? "bg-primary border-primary"
                          : "border-white/30"
                      }`}
                    >
                      {selectedPlaylists.has(playlist.id) && (
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* New Playlist Form */}
            {showNewPlaylistForm && (
              <div className="mt-4 p-3 rounded-xl border border-primary/30 bg-primary/5">
                <input
                  type="text"
                  placeholder="New playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 pb-2 mb-3 text-sm outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowNewPlaylistForm(false);
                      setNewPlaylistName("");
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-white/20 text-sm hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewPlaylistAndAdd}
                    disabled={!newPlaylistName.trim()}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create & Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <button
              onClick={() => setShowNewPlaylistForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/30 hover:border-primary/50 hover:bg-white/5 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Playlist</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSelections}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
