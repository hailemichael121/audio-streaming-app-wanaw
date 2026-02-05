'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getMonthName, getPartsForMonth } from '@/lib/audioDataService';

export default function DayScreen() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get('month');
  const monthNumber = monthParam ? parseInt(monthParam) : 1;
  const monthName = getMonthName(monthNumber);
  const parts = getPartsForMonth(monthNumber);

  return (
    <main className="min-h-svh bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 shadow-sm flex items-center gap-3">
        <Link href="/" className="active:opacity-70">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{monthName}</h1>
          <p className="text-xs opacity-90">{parts.length} parts</p>
        </div>
      </header>

      {/* Parts Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 auto-rows-max sm:grid-cols-3">
        {parts.map((part) => (
          <Link
            key={part.id}
            href={`/audios?month=${monthNumber}&part=${part.id}`}
            className="block group"
          >
            <div className="bg-card border border-border rounded-lg p-4 transition-all duration-200 active:scale-95 cursor-pointer hover:bg-secondary/10">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-card-foreground">
                    {part.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {part.songs.length} song{part.songs.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-active:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
