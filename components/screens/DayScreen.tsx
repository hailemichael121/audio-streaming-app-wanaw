"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Grid2x2 } from "lucide-react";
import { getMonthName, getPartsForMonth } from "@/lib/audioDataService";

export default function DayScreen() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const monthNumber = monthParam ? parseInt(monthParam) : 1;
  const monthName = getMonthName(monthNumber);
  const parts = getPartsForMonth(monthNumber);

  return (
    <main className="mobile-shell min-h-svh pb-32 text-foreground">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 p-4">
          <Link href="/" className="glass-chip p-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{monthName}</h1>
            <p className="text-xs text-muted-foreground">
              {parts.length} collections
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 p-4 pb-32 sm:grid-cols-3">
        {parts.map((part, index) => (
          <Link
            key={`${monthNumber}-${part.id}-${index}`} // Create unique key
            href={`/audios?month=${monthNumber}&part=${part.id}`}
            className="group"
          >
            <article className="glass-card h-full p-4">
              <div className="h-9 w-9 rounded-xl overflow-hidden mb-2 bg-gradient-to-br from-primary/20 to-accent/20">
                <img
                  src={`/images/Kdus_Yared3.png`}
                  alt="Disc"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback to a gradient background if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{part.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {part.songs.length} tracks
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
