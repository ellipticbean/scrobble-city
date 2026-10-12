
import type {
  LastFmArtist,
  TopArtistsResponse,
} from '../types/lastfm';

import { readTopArtistCache, saveTopArtistCache, topArtistCacheKey } from './topArtistCache';

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';
const pendingTopCharts = new Map<string, Promise<LastFmArtist[]>>();

// A character-code check avoids embedding literal control characters in a regex.
function containsControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => character.charCodeAt(0) < 32);
}

async function requestTopArtists(
  username: string,
  period: '7day' | '1month' | '3month' | '6month' | '12month' | 'overall' = 'overall',
  limit = 18
): Promise<LastFmArtist[]> {
  if (!API_KEY) {
    throw new Error('Missing Last.fm API key. Check your .env file.');
  }
  if (!username.trim() || username.length > 100 || containsControlCharacters(username)) {
    throw new Error('Please enter a valid Last.fm username (up to 100 characters).');
  }

  const params = new URLSearchParams({
    method: 'user.gettopartists',
    user: username,
    api_key: API_KEY,
    format: 'json',
    period,
    limit: String(limit),
  });

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}?${params.toString()}`, { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Last.fm took too long to respond. Please try again.', { cause: error });
    }
    throw new Error('Could not reach Last.fm. Check your connection and try again.', { cause: error });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 429 || response.status === 503) {
      throw new Error('Last.fm is busy or rate limiting requests. Wait a moment and retry.');
    }
    throw new Error(`Last.fm request failed (${response.status}). Please try again.`);
  }

  const data = (await response.json()) as TopArtistsResponse & {
    error?: number;
    message?: string;
  };

  if (data.error) {
    if (data.error === 6) throw new Error('Last.fm could not find that username. Double-check the spelling.');
    if (data.error === 29 || data.error === 11 || data.error === 16) {
      throw new Error('Last.fm is temporarily unavailable or rate limiting requests. Please try again later.');
    }
    throw new Error(data.message || 'Last.fm returned an error.');
  }

  if (!data.topartists || !Array.isArray(data.topartists.artist)) {
    throw new Error('Unexpected response from Last.fm.');
  }

  return data.topartists.artist;
}

/** Cached, in-flight-deduplicated public artist chart (one hour per username/period).
 * Neighborhood changes work entirely from the already loaded chart in App state.
 */
export async function getTopArtists(
  username: string,
  period: '7day' | '1month' | '3month' | '6month' | '12month' | 'overall' = 'overall',
  limit = 18,
): Promise<LastFmArtist[]> {
  const cleaned = username.trim();
  if (!cleaned || cleaned.length > 100 || containsControlCharacters(cleaned)) {
    throw new Error('Please enter a valid Last.fm username (up to 100 characters).');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('Invalid artist limit (must be 1–100).');
  }
  const key = topArtistCacheKey(cleaned, period, limit);
  const cached = readTopArtistCache(key);
  if (cached) return cached;
  const existing = pendingTopCharts.get(key);
  if (existing) return existing;
  const pending = requestTopArtists(cleaned, period, limit)
    .then((artists) => { saveTopArtistCache(key, artists); return artists; })
    .finally(() => { pendingTopCharts.delete(key); });
  pendingTopCharts.set(key, pending);
  return pending;
}

/* =========================================
   HISTORICAL LAST.FM SCROBBLES
   Step 16.1
========================================= */

// A single completed listen from Last.fm.
export interface HistoricalScrobble {
  artist: string;
  track: string;
  album: string;
  timestamp: number;
}

// One page of historical listening data.
export interface HistoricalScrobblePage {
  scrobbles: HistoricalScrobble[];
  page: number;
  totalPages: number;
  total: number;
}

// How Last.fm sends its recent-track information.
interface LastFmRecentTrack {
  name: string;
  artist: {
    '#text': string;
  } | string;
  album?: {
    '#text': string;
  };
  date?: {
    uts: string;
    '#text': string;
  };
  '@attr'?: {
    nowplaying?: string;
  };
}

interface LastFmRecentTracksResponse {
  recenttracks?: {
    track?: LastFmRecentTrack[] | LastFmRecentTrack;
    '@attr'?: {
      page?: string;
      totalPages?: string;
      total?: string;
    };
  };
  error?: number;
  message?: string;
}

// Fetch ONE page of scrobbles from a historical range.
// The start date is included; the end date is excluded.
export async function getHistoricalScrobblesPage(
  username: string,
  startDate: Date,
  endDate: Date,
  page = 1,
  signal?: AbortSignal
): Promise<HistoricalScrobblePage> {
  if (!API_KEY) {
    throw new Error('Missing Last.fm API key.');
  }

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  ) {
    throw new Error('Invalid historical date range.');
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Invalid page number.');
  }

  const fromSeconds = Math.floor(startTime / 1000);
  const toSeconds = Math.floor(endTime / 1000);

  const params = new URLSearchParams({
    method: 'user.getrecenttracks',
    user: username,
    api_key: API_KEY,
    format: 'json',
    limit: '200',
    page: String(page),
    from: String(Math.max(0, fromSeconds - 1)),
    to: String(toSeconds),
  });

  const response = await fetch(
    `${BASE_URL}?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(
      `Last.fm request failed: ${response.status}`
    );
  }

  const data =
    (await response.json()) as LastFmRecentTracksResponse;

  if (data.error) {
    throw new Error(
      data.message || `Last.fm error ${data.error}`
    );
  }

  if (!data.recenttracks) {
    throw new Error(
      'Unexpected historical response from Last.fm.'
    );
  }

  const rawTracks = data.recenttracks.track ?? [];

  const tracks = Array.isArray(rawTracks)
    ? rawTracks
    : [rawTracks];

  const scrobbles: HistoricalScrobble[] = [];

  for (const track of tracks) {
    // Currently playing tracks have no completed
    // scrobble timestamp and should not be counted.
    if (!track.date?.uts) continue;

    const timestamp = Number(track.date.uts);

    if (
      !Number.isFinite(timestamp) ||
      timestamp < fromSeconds ||
      timestamp >= toSeconds
    ) {
      continue;
    }

    const artist =
      typeof track.artist === 'string'
        ? track.artist
        : track.artist?.['#text'] ?? '';

    if (!artist || !track.name) continue;

    scrobbles.push({
      artist,
      track: track.name,
      album: track.album?.['#text'] ?? '',
      timestamp,
    });
  }

  const metadata = data.recenttracks['@attr'];

  const parsedTotalPages = Number(
    metadata?.totalPages ?? 1
  );

  const totalPages =
    Number.isFinite(parsedTotalPages) &&
      parsedTotalPages >= 1
      ? Math.floor(parsedTotalPages)
      : 1;

  return {
    scrobbles,
    page,
    totalPages,
    total: Number(metadata?.total ?? 0),
  };
}
