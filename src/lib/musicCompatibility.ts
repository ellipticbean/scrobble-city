
import { getTopArtists } from './lastfm';

import type {
  LastFmArtist,
  LastFmPeriod,
} from '../types/lastfm';

/* =========================================
   SCROBBLE CITY - MUSIC COMPATIBILITY
========================================= */

const ARTIST_LIMIT = 100;

export interface CompatibilityArtist {
  name: string;
  rank: number;
  playcount: number;
}

export interface SharedArtist {
  name: string;
  firstRank: number;
  secondRank: number;
  firstPlays: number;
  secondPlays: number;
}

export interface MusicCompatibilityReport {
  firstUsername: string;
  secondUsername: string;
  period: LastFmPeriod;

  // Playful similarity score from 0 to 100.
  score: number;
  verdict: string;

  sharedCount: number;
  firstArtistCount: number;
  secondArtistCount: number;

  sharedArtists: SharedArtist[];
  firstOnly: CompatibilityArtist[];
  secondOnly: CompatibilityArtist[];
}

/* =========================================
   NAME NORMALIZATION
========================================= */

function normalizeName(name: string): string {
  return name
    .trim()
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-US');
}

/* =========================================
   PREPARE ARTIST LISTS
========================================= */

function prepareArtists(
  artists: LastFmArtist[]
): Map<string, CompatibilityArtist> {
  const result = new Map<string, CompatibilityArtist>();

  artists.forEach((artist, index) => {
    const key = normalizeName(artist.name);

    if (!key || result.has(key)) {
      return;
    }

    const apiRank = Number(artist['@attr']?.rank);

    result.set(key, {
      name: artist.name,
      rank:
        Number.isFinite(apiRank) && apiRank > 0
          ? apiRank
          : index + 1,
      playcount: Number(artist.playcount) || 0,
    });
  });

  return result;
}

/* =========================================
   COMPATIBILITY CLASSIFICATIONS
========================================= */

function getVerdict(score: number): string {
  if (score >= 80) {
    return 'Musical Doppelgängers';
  }

  if (score >= 55) {
    return 'Headphone Soulmates';
  }

  if (score >= 30) {
    return 'Playlist Sweethearts';
  }

  if (score >= 10) {
    return 'Different Frequencies';
  }

  return 'Opposite Sides of the Record';
}

/* =========================================
   COMPARE TWO ARTIST CHARTS
========================================= */

export function compareMusicTastes(
  firstUsername: string,
  secondUsername: string,
  period: LastFmPeriod,
  firstArtists: LastFmArtist[],
  secondArtists: LastFmArtist[]
): MusicCompatibilityReport {
  const first = prepareArtists(firstArtists);
  const second = prepareArtists(secondArtists);

  const artistKeys = new Set([
    ...first.keys(),
    ...second.keys(),
  ]);

  const sharedArtists: SharedArtist[] = [];
  const firstOnly: CompatibilityArtist[] = [];
  const secondOnly: CompatibilityArtist[] = [];

  let weightedIntersection = 0;
  let weightedUnion = 0;

  for (const key of artistKeys) {
    const a = first.get(key);
    const b = second.get(key);

    // Higher-ranked artists receive more weight.
    const aWeight = a
      ? 1 / Math.sqrt(a.rank)
      : 0;

    const bWeight = b
      ? 1 / Math.sqrt(b.rank)
      : 0;

    weightedIntersection += Math.min(
      aWeight,
      bWeight
    );

    weightedUnion += Math.max(
      aWeight,
      bWeight
    );

    if (a && b) {
      sharedArtists.push({
        name: a.name,
        firstRank: a.rank,
        secondRank: b.rank,
        firstPlays: a.playcount,
        secondPlays: b.playcount,
      });
    } else if (a) {
      firstOnly.push(a);
    } else if (b) {
      secondOnly.push(b);
    }
  }

  // Weighted Jaccard similarity:
  // 100 = identical ranked artist lists.
  // 0 = no artists in common.
  const score = weightedUnion > 0
    ? Math.round(
        (weightedIntersection / weightedUnion) * 100
      )
    : 0;

  // Prioritize artists that rank highly
  // for both listeners.
  sharedArtists.sort((a, b) => {
    const aAverage =
      (a.firstRank + a.secondRank) / 2;

    const bAverage =
      (b.firstRank + b.secondRank) / 2;

    return aAverage - bAverage;
  });

  firstOnly.sort((a, b) => a.rank - b.rank);
  secondOnly.sort((a, b) => a.rank - b.rank);

  return {
    firstUsername,
    secondUsername,
    period,

    score,
    verdict: getVerdict(score),

    sharedCount: sharedArtists.length,
    firstArtistCount: first.size,
    secondArtistCount: second.size,

    sharedArtists,
    firstOnly,
    secondOnly,
  };
}

/* =========================================
   RETRIEVE TWO LAST.FM ACCOUNTS
========================================= */

export async function getMusicCompatibility(
  firstUsername: string,
  secondUsername: string,
  period: LastFmPeriod = 'overall'
): Promise<MusicCompatibilityReport> {
  const first = firstUsername.trim();
  const second = secondUsername.trim();

  if (!first || !second) {
    throw new Error(
      'Please enter two Last.fm usernames.'
    );
  }

  if (
    first.toLowerCase() === second.toLowerCase()
  ) {
    throw new Error(
      'Choose two different Last.fm usernames.'
    );
  }

  // Retrieve up to 100 ranked artists per user.
  const [firstArtists, secondArtists] =
    await Promise.all([
      getTopArtists(first, period, ARTIST_LIMIT),
      getTopArtists(second, period, ARTIST_LIMIT),
    ]);

  if (firstArtists.length === 0) {
    throw new Error(
      `No artist data found for ${first}.`
    );
  }

  if (secondArtists.length === 0) {
    throw new Error(
      `No artist data found for ${second}.`
    );
  }

  return compareMusicTastes(
    first,
    second,
    period,
    firstArtists,
    secondArtists
  );
}
