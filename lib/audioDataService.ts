import type { Audio } from "./types";
import { ALL_ETHIOPIAN_MONTHS } from "./monthConstants";

/** Ethiopian months (id + name) for compatibility with components that expect { number, name } */
export const MONTHS = ALL_ETHIOPIAN_MONTHS.map((m) => ({
  number: m.id,
  name: m.name,
}));

/** Get all audios from all months (flatten parts' songs) */
export function getAllAudios(): Audio[] {
  const allAudios: Audio[] = [];
  for (const month of ALL_ETHIOPIAN_MONTHS) {
    for (const part of month.parts) {
      allAudios.push(...part.songs);
    }
  }
  return allAudios;
}

/** Search across all audios (title, category, month name) */
export function searchAudios(query: string, limit = 50): Audio[] {
  if (!query.trim()) return [];

  const searchQuery = query.toLowerCase();
  const allAudios = getAllAudios();

  const results = allAudios.filter((audio) => {
    const monthName = getMonthName(audio.month);
    const searchableText = `${audio.title} ${monthName}`.toLowerCase();
    return searchableText.includes(searchQuery);
  });

  return results.slice(0, limit);
}

/**
 * Get audios for a month and part (Ethiopian flow).
 * Also supports legacy month/day/category: day is treated as part index, category is ignored.
 */
export function getAudios(
  monthNumber: number,
  partOrDay: number,
  _category?: string,
): Audio[] {
  const month = ALL_ETHIOPIAN_MONTHS.find((m) => m.id === monthNumber);
  if (!month) return [];

  const partIndex = partOrDay - 1;
  if (partIndex < 0 || partIndex >= month.parts.length) return [];

  return month.parts[partIndex].songs;
}

/** Get month name by id (1–15, Ethiopian calendar) */
export function getMonthName(monthNumber: number): string {
  return ALL_ETHIOPIAN_MONTHS.find((m) => m.id === monthNumber)?.name ?? "";
}

/** Get all months (Ethiopian calendar, 15 months) */
export function getMonths() {
  return MONTHS;
}

/** Get max parts in a month (for the given month id) */
export function getMaxPartsInMonth(monthNumber: number): number {
  const month = ALL_ETHIOPIAN_MONTHS.find((m) => m.id === monthNumber);
  return month?.parts.length ?? 0;
}

/** Get parts for a month (for components that need part list) */
export function getPartsForMonth(monthNumber: number) {
  const month = ALL_ETHIOPIAN_MONTHS.find((m) => m.id === monthNumber);
  return month?.parts ?? [];
}

/** Legacy: categories (kept for backward compatibility) */
const CATEGORIES = ["one", "two"];
export function getCategories() {
  return CATEGORIES;
}
