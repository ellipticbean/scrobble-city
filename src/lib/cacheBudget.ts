/** Conservative approximate browser-storage budget for cached Last.fm charts.
 * Stored progress and fictional souvenirs are not Last.fm API caches.
 * JSON UTF-16 length is deliberately an upper estimate for most API text.
 */
export interface TimedCacheEntry {
  key: string;
  savedAt: number;
}

export interface CacheBudget {
  ttlMs: number;
  maxBytes: number;
  maxEntries: number;
}

export function estimatedBytes(value: unknown): number {
  try { return JSON.stringify(value).length * 2; } catch { return Infinity; }
}

/** Retain most recent valid records, evicting old entries and respecting a hard size budget. */
export function retainWithinBudget<T extends TimedCacheEntry>(
  entries: readonly T[], budget: CacheBudget, now = Date.now(),
): T[] {
  const recent = entries
    .filter((entry) => entry && typeof entry.key === 'string'
      && Number.isFinite(entry.savedAt) && entry.savedAt <= now
      && now - entry.savedAt <= budget.ttlMs)
    .sort((a, b) => b.savedAt - a.savedAt);
  const seen = new Set<string>();
  const kept: T[] = [];
  let totalBytes = 0;
  for (const item of recent) {
    if (seen.has(item.key)) continue;
    seen.add(item.key);
    const size = estimatedBytes(item);
    if (kept.length >= budget.maxEntries) break;
    if (size > budget.maxBytes || totalBytes + size > budget.maxBytes) continue;
    kept.push(item);
    totalBytes += size;
  }
  return kept;
}
