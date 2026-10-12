
import type { LastFmArtist } from '../types/lastfm';

import {
  getHistoricalScrobblesPage,
  type HistoricalScrobblePage,
} from './lastfm';

/* =========================================
   SCROBBLE CITY
   HISTORICAL LISTENING STATISTICS
   Step 16.6 - Resilient downloads
========================================= */

const MAX_PAGES = 200;

// Space out normal API requests.
const REQUEST_DELAY_MS = 1100;

// One initial attempt plus three retries.
const MAX_ATTEMPTS = 4;

const RETRY_BASE_DELAY_MS = 1500;

export interface HistoricalProgress {
  pagesFetched: number;
  totalPages: number;
  scrobblesProcessed: number;
}

export interface HistoricalArtistChart {
  artists: LastFmArtist[];
  totalScrobbles: number;
  totalArtists: number;
  pagesFetched: number;
  startDate: Date;
  endDate: Date;
}

interface HistoricalOptions {
  signal?: AbortSignal;
  onProgress?: (progress: HistoricalProgress) => void;
}

/* =========================================
   HELPERS
========================================= */

function checkCancelled(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error(
      'Historical listening request cancelled.'
    );
  }
}

async function delay(
  milliseconds: number,
  signal?: AbortSignal
): Promise<void> {
  checkCancelled(signal);

  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

  checkCancelled(signal);
}

function normalizeArtistName(name: string): string {
  return name
    .trim()
    .normalize('NFKC')
    .toLocaleLowerCase('en-US');
}

// Only retry errors that may be temporary.
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    /last\.fm request failed: (429|500|502|503|504)(\D|$)/.test(
      message
    ) ||
    /rate limit|temporar|service offline|too many requests/.test(
      message
    )
  );
}

/* =========================================
   RETRY FAILED API REQUESTS
========================================= */

async function fetchPageWithRetry(
  username: string,
  startDate: Date,
  endDate: Date,
  page: number,
  signal?: AbortSignal
): Promise<HistoricalScrobblePage> {
  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt++
  ) {
    checkCancelled(signal);

    try {
      return await getHistoricalScrobblesPage(
        username,
        startDate,
        endDate,
        page,
        signal
      );

    } catch (error) {
      checkCancelled(signal);

      const canRetry =
        isRetryableError(error) &&
        attempt < MAX_ATTEMPTS;

      if (!canRetry) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown API error';

        throw new Error(
          `Could not load archive page ${page}. ` +
          `${message}`,
          { cause: error }
        );
      }

      const waitTime =
        RETRY_BASE_DELAY_MS *
        Math.pow(2, attempt - 1);

      console.warn(
        `Last.fm page ${page} failed. ` +
        `Retry ${attempt}/${MAX_ATTEMPTS - 1} ` +
        `in ${waitTime / 1000} seconds.`,
        error
      );

      await delay(waitTime, signal);
    }
  }

  throw new Error(
    `Could not load archive page ${page}.`
  );
}

/* =========================================
   GENERATE HISTORICAL ARTIST CHART
========================================= */

export async function getHistoricalArtistChart(
  username: string,
  startDate: Date,
  endDate: Date,
  options: HistoricalOptions = {}
): Promise<HistoricalArtistChart> {
  const { signal, onProgress } = options;

  const artistCounts = new Map<
    string,
    {
      name: string;
      playcount: number;
    }
  >();

  let totalScrobbles = 0;
  // The counter is first read after page one has successfully loaded.
  let pagesFetched = 1;

  /* =====================================
     PROCESS A PAGE OF SCROBBLES
  ===================================== */

  function processPage(
    scrobbles: {
      artist: string;
      timestamp: number;
    }[]
  ) {
    for (const scrobble of scrobbles) {
      const name = scrobble.artist.trim();
      const key = normalizeArtistName(name);

      if (!key) continue;

      const existing = artistCounts.get(key);

      if (existing) {
        existing.playcount += 1;
      } else {
        artistCounts.set(key, {
          name,
          playcount: 1,
        });
      }

      totalScrobbles++;
    }
  }

  /* =====================================
     FIRST PAGE
  ===================================== */

  const firstPage = await fetchPageWithRetry(
    username,
    startDate,
    endDate,
    1,
    signal
  );

  const totalPages = firstPage.totalPages;

  if (totalPages > MAX_PAGES) {
    throw new Error(
      `This historical period requires ` +
      `${totalPages} pages, exceeding the ` +
      `current limit of ${MAX_PAGES}. ` +
      `Please select a shorter date range.`
    );
  }

  processPage(firstPage.scrobbles);

  onProgress?.({
    pagesFetched,
    totalPages,
    scrobblesProcessed: totalScrobbles,
  });

  /* =====================================
     REMAINING PAGES
  ===================================== */

  for (
    let page = 2;
    page <= totalPages;
    page++
  ) {
    checkCancelled(signal);

    await delay(REQUEST_DELAY_MS, signal);

    const result = await fetchPageWithRetry(
      username,
      startDate,
      endDate,
      page,
      signal
    );

    processPage(result.scrobbles);
    pagesFetched = page;

    onProgress?.({
      pagesFetched,
      totalPages,
      scrobblesProcessed: totalScrobbles,
    });
  }

  /* =====================================
     RANK ARTISTS
  ===================================== */

  const sortedArtists = Array.from(
    artistCounts.values()
  ).sort((a, b) => {
    if (b.playcount !== a.playcount) {
      return b.playcount - a.playcount;
    }

    return a.name.localeCompare(b.name);
  });

  const artists: LastFmArtist[] = sortedArtists.map(
    (artist, index) => ({
      name: artist.name,
      playcount: String(artist.playcount),
      '@attr': {
        rank: String(index + 1),
      },
    })
  );

  return {
    artists,
    totalScrobbles,
    totalArtists: artists.length,
    pagesFetched,
    startDate,
    endDate,
  };
}
