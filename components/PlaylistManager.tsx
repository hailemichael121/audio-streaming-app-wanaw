// Update the entire PlaylistManager component for better UI:

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Copy,
  Check,
  Clock,
  Hash,
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

  const generateShareLink = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const data = {
      name: playlist.name,
      audioIds: playlist.audios.map((a) => a.id),
    };

    const encoded = btoa(JSON.stringify(data));
    const link = `${window.location.origin}/playlist?id=${playlistId}`;
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
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-card/80">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl overflow-hidden mb-2">
                <img
                  src="/images/mahder.png"
                  alt="Disc"
                  className="h-full w-full object-fit"
                />
              </div>{" "}
              <div>
                <h2 className="text-xl font-bold">Your Playlists</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {playlists.length} playlists • Manage and organize
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Playlist List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <div className="h-9 w-9 rounded-xl overflow-hidden mb-2">
                    <img
                      src="/images/mahder.png"
                      alt="Disc"
                      className="h-full w-full object-fit"
                    />
                  </div>{" "}
                </div>
                <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Create your first playlist to organize your favorite tracks
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="group relative flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-card/60 hover:bg-card/80 hover:border-primary/30 transition-all duration-200"
                  >
                    {/* Playlist icon and info */}
                    <Link
                      href={`/playlist?id=${playlist.id}`}
                      className="flex-1 min-w-0"
                      onClick={onClose}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl overflow-hidden mb-2">
                          <img
                            src="/images/Kdus_Yared2.png"
                            alt="Disc"
                            className="h-full w-full object-fit"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          {editingPlaylistId === playlist.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  renamePlaylist(playlist.id);
                                }}
                                className="p-2 rounded-lg bg-primary text-primary-foreground"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setEditingPlaylistId(null);
                                }}
                                className="p-2 rounded-lg hover:bg-white/10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg truncate">
                                  {playlist.name}
                                </h3>
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                  {playlist.audios.length}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Updated{" "}
                                  {new Date(
                                    playlist.updated,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  {playlist.audios.length} tracks
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Right side action buttons */}
                    <div className="flex items-center gap-1">
                      {/* Add current track button */}
                      {currentAudio &&
                        !playlist.audios.some(
                          (a) => a.id === currentAudio.id,
                        ) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              addToPlaylist(playlist.id, currentAudio);
                            }}
                            className="p-2 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            title="Add current track to playlist"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}

                      {/* More options button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSelectedPlaylistId(
                              selectedPlaylistId === playlist.id
                                ? null
                                : playlist.id,
                            );
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown menu */}
                        {selectedPlaylistId === playlist.id && (
                          <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-white/20 bg-card/95 backdrop-blur-xl shadow-2xl z-10 py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setEditingPlaylistId(playlist.id);
                                setEditName(playlist.name);
                                setSelectedPlaylistId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center gap-3"
                            >
                              <Pencil className="w-4 h-4" />
                              <span>Rename playlist</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                generateShareLink(playlist.id);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center gap-3"
                            >
                              <Share2 className="w-4 h-4" />
                              <span>Share playlist</span>
                            </button>
                            <div className="h-px bg-white/10 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                deletePlaylist(playlist.id);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete playlist</span>
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

          {/* Footer - New Playlist Button */}
          <div className="p-5 border-t border-white/10 bg-card/80">
            {showNewPlaylistForm ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    New Playlist Name
                  </label>
                  <input
                    type="text"
                    placeholder="My Awesome Playlist"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowNewPlaylistForm(false);
                      setNewPlaylistName("");
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewPlaylist}
                    disabled={!newPlaylistName.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    Create Playlist
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewPlaylistForm(true)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-dashed border-primary/50 hover:border-primary bg-primary/10 hover:bg-primary/20 transition-all duration-200 group"
              >
                <div className="p-1.5 rounded-lg bg-primary text-primary-foreground group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-semibold text-primary">
                  Create New Playlist
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="bg-card/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/20 text-primary">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Share Playlist</h3>
                <p className="text-sm text-muted-foreground">
                  Copy the link to share
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm truncate"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowShareDialog(false)}
                className="w-full px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
