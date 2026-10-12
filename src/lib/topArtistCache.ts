import type { LastFmArtist, LastFmPeriod } from '../types/lastfm';
import { retainWithinBudget } from './cacheBudget';

// Last.fm top charts are public, read-only data. Keep a small bounded snapshot
// to avoid re-fetching the same top 100 on every city refresh or comparison.
const STORAGE_KEY = 'scrobble-city-top-artists-v1';
const MAX_BYTES = 2 * 1024 * 1024;
const CACHE_POLICY = { ttlMs: 60 * 60 * 1000, maxBytes: MAX_BYTES, maxEntries: 24 };

interface TopChartEntry {
  key: string;
  savedAt: number;
  artists: LastFmArtist[];
}

export function topArtistCacheKey(username: string, period: LastFmPeriod, limit: number): string {
  return `${username.trim().normalize('NFKC').toLowerCase()}|${period}|${limit}`;
}

function getStorage(): Storage | null {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch { return null; }
}

function getEntries(storage: Storage): TopChartEntry[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw || raw.length * 2 > MAX_BYTES * 2) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is TopChartEntry => {
      if (!item || typeof item !== 'object') return false;
      const value = item as Partial<TopChartEntry>;
      return typeof value.key === 'string' && typeof value.savedAt === 'number'
        && Array.isArray(value.artists);
    });
  } catch { return []; }
}

export function readTopArtistCache(key: string): LastFmArtist[] | null {
  const storage = getStorage();
  if (!storage) return null;
  const entry = retainWithinBudget(getEntries(storage), CACHE_POLICY).find((item) => item.key === key);
  return entry?.artists ?? null;
}

export function saveTopArtistCache(key: string, artists: LastFmArtist[]): void {
  const storage = getStorage();
  if (!storage) return;
  const newEntry: TopChartEntry = { key, savedAt: Date.now(), artists };
  const entries = retainWithinBudget([newEntry, ...getEntries(storage)], CACHE_POLICY);
  try { storage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
  catch { /* Disabling storage or reaching quota must never break the city. */ }
}
