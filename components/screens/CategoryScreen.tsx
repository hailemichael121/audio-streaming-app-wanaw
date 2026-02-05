'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getMonthName, getPartsForMonth } from '@/lib/audioDataService';

export default function CategoryScreen() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get('month');
  const dayParam = searchParams.get('day');
  const monthNumber = monthParam ? parseInt(monthParam) : 1;
  const day = dayParam ? parseInt(dayParam) : 1;
  const monthName = getMonthName(monthNumber);
  const parts = getPartsForMonth(monthNumber);
  const currentPart = parts.find((p) => p.id === day);

  return (
    <main className="min-h-svh bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 shadow-sm flex items-center gap-3">
        <Link href={`/day?month=${monthNumber}`} className="active:opacity-70">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{monthName} - Part {day}</h1>
          <p className="text-xs opacity-90">Select a category</p>
        </div>
      </header>

      {/* Part / Category Cards: link to songs for this part */}
      <div className="p-4 space-y-3">
        <Link
          href={`/audios?month=${monthNumber}&part=${day}`}
          className="block group"
        >
          <div className="bg-card border border-border rounded-lg p-5 transition-all duration-200 active:scale-95 cursor-pointer hover:bg-secondary/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-card-foreground">
                  {currentPart?.name ?? `Part ${day}`}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentPart?.songs.length ?? 0} songs
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-accent group-active:translate-x-1 transition-transform flex-shrink-0 mt-1" />
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
