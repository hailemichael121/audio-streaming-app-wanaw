// components/AudioPlayerSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Music2 } from "lucide-react";

export function AudioArtworkSkeleton() {
  return (
    <div className="rounded-3xl border border-white/20 bg-card/60 p-8 text-center">
      <div className="mx-auto h-40 w-40 rounded-3xl bg-primary/20 shadow-inner" />
      <div className="mt-6 space-y-2">
        <Skeleton className="mx-auto h-4 w-2/3 rounded-lg" />
        <Skeleton className="mx-auto h-3 w-1/3 rounded-lg" />
      </div>
    </div>
  );
}
export function AudioTitleRowSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2 w-2/3">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  );
}
export function AudioProgressSkeleton() {
  return <Skeleton className="h-2 w-full rounded-full" />;
}
export function AudioPlaybackControlsSkeleton() {
  return (
    <div className="flex justify-center gap-6">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-14 w-14 rounded-full bg-primary/30" />
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
  );
}
