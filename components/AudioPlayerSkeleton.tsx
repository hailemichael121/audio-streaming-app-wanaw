// components/AudioPlayerSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Music2 } from "lucide-react";

export function AudioArtworkSkeleton() {
  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] rounded-[1.5rem] overflow-hidden border border-white/20 shadow-2xl bg-card/60">
      <div className="relative aspect-square w-full">
        {/* Artwork area with same color tone as old skeleton */}
        <div className="absolute inset-0 bg-primary/5 shadow-inner rounded-none" />

        {/* Bottom fade simulation */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-primary/20 shadow-inner" />

        {/* Text placeholders */}
        <div className="absolute bottom-6 left-6 right-6 space-y-2.5">
          <Skeleton className="h-4 w-2/3 rounded-lg opacity-80 bg-primary/20" />
        </div>
      </div>
    </div>
  );
}

// Title part skeleton only
export function AudioTitleSkeleton() {
  return (
    <div className="space-y-2 w-2/3">
      <Skeleton className="h-4 w-3/4 rounded-lg" />
      <Skeleton className="h-3 w-1/2 rounded-lg" />
    </div>
  );
}

// Action buttons skeleton only
export function AudioActionButtonsSkeleton() {
  return (
    <div className="flex gap-2 ">
      <Skeleton className="h-9 w-9 bg-primary/20 rounded-xl" />
      <Skeleton className="h-9 w-9 rounded-xl bg-primary/30" />
      <Skeleton className="h-9 w-9 rounded-xl bg-primary/25" />
    </div>
  );
}

// Full row skeleton (legacy, for backward compatibility)
export function AudioTitleRowSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <AudioTitleSkeleton />
      <AudioActionButtonsSkeleton />
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
