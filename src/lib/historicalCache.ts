
import type {
  HistoricalArtistChart,
  HistoricalProgress,
} from './historicalStats';

import {
  getHistoricalArtistChart,
} from './historicalStats';
import { retainWithinBudget } from './cacheBudget';

/* =========================================
   SCROBBLE CITY - HISTORICAL CACHE
========================================= */

const DB_NAME = 'scrobble-city-history';
const STORE_NAME = 'artistCharts';
const CACHE_VERSION = 1;

// Refresh stored statistics after 24 hours.
const CACHE_DURATION = 24 * 60 * 60 * 1000;
// Historical caches contain only aggregated artist counts, NEVER raw scrobbles.
// Cap local storage far below the 100 MB figure in Last.fm's response.
const HISTORY_POLICY = {
  ttlMs: CACHE_DURATION,
  maxBytes: 12 * 1024 * 1024,
  maxEntries: 32,
};

interface CachedChart {
  key: string;
  savedAt: number;
  chart: HistoricalArtistChart;
}

interface HistoricalCacheOptions {
  signal?: AbortSignal;
  onProgress?: (progress: HistoricalProgress) => void;
}

/* =========================================
   OPEN DATABASE
========================================= */

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'key',
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
        new Error('Could not open historical cache.')
      );
    };
  });
}

/* =========================================
   CACHE KEY
========================================= */

function createCacheKey(
  username: string,
  startDate: Date,
  endDate: Date
): string {
  return [
    CACHE_VERSION,
    username.trim().toLowerCase(),
    startDate.toISOString(),
    endDate.toISOString(),
  ].join('|');
}

/* =========================================
   READ CACHE
========================================= */

async function readCache(
  key: string
): Promise<HistoricalArtistChart | null> {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  let db: IDBDatabase | null = null;

  try {
    db = await openDatabase();

    const record = await new Promise<
      CachedChart | undefined
    >((resolve, reject) => {
      const transaction = db!.transaction(
        STORE_NAME,
        'readonly'
      );

      const request = transaction
        .objectStore(STORE_NAME)
        .get(key);

      request.onsuccess = () => {
        resolve(request.result as CachedChart | undefined);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    if (!record) return null;

    // Ignore results that are too old.
    if (
      Date.now() - record.savedAt > CACHE_DURATION
    ) {
      return null;
    }

    return record.chart;

  } catch (error) {
    console.warn(
      'Historical cache unavailable:',
      error
    );

    return null;

  } finally {
    db?.close();
  }
}

/* =========================================
   SAVE CACHE
========================================= */

async function saveCache(
  key: string,
  chart: HistoricalArtistChart
): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return;
  }

  let db: IDBDatabase | null = null;

  try {
    db = await openDatabase();

    const database = db;

    // One read/write transaction: read existing cached charts, discard expired
    // or oldest ones, and atomically replace the bounded cache contents.
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const now = Date.now();
        const oldEntries = (request.result as CachedChart[]).filter(
          (entry) => entry && entry.key !== key
        );
        const next = retainWithinBudget([
          { key, savedAt: now, chart },
          ...oldEntries,
        ], HISTORY_POLICY, now);
        store.clear();
        for (const entry of next) store.put(entry);
      };
      request.onerror = () => { transaction.abort(); };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Cache write failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Cache transaction aborted.'));
    });

  } catch (error) {
    // Cache failures must never break the website.
    console.warn(
      'Could not save historical cache:',
      error
    );

  } finally {
    db?.close();
  }
}

/** Clean up caches written by older Scrobble City versions before first use.
 * Runs once per page load, and does not persist raw scrobble pages.
 */
async function pruneExistingHistoricalCache(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  let db: IDBDatabase | null = null;
  try {
    db = await openDatabase();
    const database = db;
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const kept = retainWithinBudget(request.result as CachedChart[], HISTORY_POLICY);
        // Rewrite only if old versions left expired or excessive data.
        if (kept.length !== request.result.length) {
          store.clear();
          for (const entry of kept) store.put(entry);
        }
      };
      request.onerror = () => transaction.abort();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Could not prune historical cache:', error);
  } finally {
    db?.close();
  }
}

let firstCacheCleanup: Promise<void> | null = null;

/* =========================================
   CACHED HISTORICAL REQUEST
========================================= */

export async function getCachedHistoricalArtistChart(
  username: string,
  startDate: Date,
  endDate: Date,
  options: HistoricalCacheOptions = {}
): Promise<HistoricalArtistChart> {
  if (options.signal?.aborted) {
    throw new Error('Historical request cancelled.');
  }

  firstCacheCleanup ??= pruneExistingHistoricalCache();
  await firstCacheCleanup;

  const key = createCacheKey(
    username,
    startDate,
    endDate
  );

  // Try locally stored results first.
  const cached = await readCache(key);

  if (options.signal?.aborted) {
    throw new Error('Historical request cancelled.');
  }

  if (cached) {
    console.info(
      `Loaded ${username}'s historical chart from cache.`
    );

    options.onProgress?.({
      pagesFetched: cached.pagesFetched,
      totalPages: cached.pagesFetched,
      scrobblesProcessed: cached.totalScrobbles,
    });

    return cached;
  }

  // No cached chart: retrieve data from Last.fm.
  const result = await getHistoricalArtistChart(
    username,
    startDate,
    endDate,
    options
  );

  // Save successfully completed results only.
  await saveCache(key, result);

  return result;
}
