"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Copy,
  Check,
  Music2,
  Play,
  Pause,
} from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioContext";
import type { Audio } from "@/lib/types";

interface Playlist {
  id: string;
  name: string;
  description?: string;
  created: number;
  updated: number;
  audios: Audio[];
}

interface PlaylistManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAudio?: Audio;
}

export default function PlaylistManager({
  isOpen,
  onClose,
  currentAudio,
}: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = () => {
    const saved = localStorage.getItem("playlists");
    if (saved) {
      setPlaylists(JSON.parse(saved));
    }
  };

  const savePlaylists = (updatedPlaylists: Playlist[]) => {
    localStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
    setPlaylists(updatedPlaylists);
  };

  const createNewPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName.trim(),
      created: Date.now(),
      updated: Date.now(),
      audios: currentAudio ? [currentAudio] : [],
    };

    const updated = [...playlists, newPlaylist];
    savePlaylists(updated);
    setNewPlaylistName("");
    setShowNewPlaylistForm(false);
  };

  const deletePlaylist = (playlistId: string) => {
    const updated = playlists.filter((p) => p.id !== playlistId);
    savePlaylists(updated);
  };

  const renamePlaylist = (playlistId: string) => {
    if (!editName.trim()) return;

    const updated = playlists.map((p) =>
      p.id === playlistId
        ? { ...p, name: editName.trim(), updated: Date.now() }
        : p,
    );

    savePlaylists(updated);
    setEditingPlaylistId(null);
    setEditName("");
  };

  const addToPlaylist = (playlistId: string, audio: Audio) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        // Check if audio already exists
        if (!p.audios.some((a) => a.id === audio.id)) {
          return {
            ...p,
            audios: [...p.audios, audio],
            updated: Date.now(),
          };
        }
      }
      return p;
    });

    savePlaylists(updated);
  };

  const removeFromPlaylist = (playlistId: string, audioId: string) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        return {
          ...p,
          audios: p.audios.filter((a) => a.id !== audioId),
          updated: Date.now(),
        };
      }
      return p;
    });

    savePlaylists(updated);
  };

  const generateShareLink = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const data = {
      name: playlist.name,
      audioIds: playlist.audios.map((a) => a.id),
    };

    const encoded = btoa(JSON.stringify(data));
    const link = `${window.location.origin}/playlist?data=${encoded}`;
    setShareLink(link);
    setShowShareDialog(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-70 flex items-end p-2 pointer-events-none sm:items-center sm:justify-center">
        <div
          className="pointer-events-auto w-full max-w-md max-h-[80svh] flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-card/95 backdrop-blur-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">Playlists</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Playlist List */}
          <div className="flex-1 overflow-y-auto p-4">
            {playlists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="h-9 w-9 rounded-xl overflow-hidden mb-2">
                  <img
                    src="/images/Tsenatsl3.png"
                    alt="Disc"
                    className="h-full w-full object-cover"
                  />
                </div>{" "}
                <p>No playlists yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="group flex items-center justify-between p-3 rounded-xl border border-white/10 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      {editingPlaylistId === playlist.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => renamePlaylist(playlist.id)}
                            className="p-1.5 rounded-lg bg-primary text-primary-foreground"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPlaylistId(null)}
                            className="p-1.5 rounded-lg hover:bg-white/10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-medium truncate">
                            {playlist.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {playlist.audios.length} tracks • Updated{" "}
                            {new Date(playlist.updated).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {currentAudio &&
                        !playlist.audios.some(
                          (a) => a.id === currentAudio.id,
                        ) && (
                          <button
                            onClick={() =>
                              addToPlaylist(playlist.id, currentAudio)
                            }
                            className="p-1.5 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Add current track"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}

                      <div className="relative">
                        <button
                          onClick={() =>
                            setSelectedPlaylistId(
                              selectedPlaylistId === playlist.id
                                ? null
                                : playlist.id,
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-white/10"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {selectedPlaylistId === playlist.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-white/20 bg-card/95 backdrop-blur-xl shadow-lg z-10 py-1">
                            <button
                              onClick={() => {
                                setEditingPlaylistId(playlist.id);
                                setEditName(playlist.name);
                                setSelectedPlaylistId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Rename
                            </button>
                            <button
                              onClick={() => generateShareLink(playlist.id)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Share
                            </button>
                            <button
                              onClick={() => deletePlaylist(playlist.id)}
                              className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            {showNewPlaylistForm ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowNewPlaylistForm(false);
                      setNewPlaylistName("");
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewPlaylist}
                    disabled={!newPlaylistName.trim()}
                    className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewPlaylistForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/30 hover:border-primary/50 hover:bg-white/5 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>New Playlist</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
          <div
            className="bg-card/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3">Share Playlist</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Copy the link below to share this playlist:
            </p>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm truncate"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground"
              >
                {copySuccess ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              onClick={() => setShowShareDialog(false)}
              className="w-full px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
