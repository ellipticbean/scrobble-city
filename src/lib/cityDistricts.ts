import type { LastFmArtist } from '../types/lastfm';

/* =========================================
   SCROBBLE CITY - NEIGHBORHOOD PLANNER
   Step 19.1A

   Organizes ranked artists into small districts.
   Does not change the existing map until wired in.
========================================= */

export const ARTISTS_PER_DISTRICT = 15;

interface DistrictTheme {
  name: string;
  description: string;
  accent: string;
}

const DISTRICT_THEMES: DistrictTheme[] = [
  {
    name: 'Town Center',
    description: 'The biggest names and tallest buildings.',
    accent: '#b99bce',
  },
  {
    name: 'Willow Walk',
    description: 'A leafy avenue of familiar favorites.',
    accent: '#93bc9e',
  },
  {
    name: 'Vinyl Valley',
    description: 'A colorful block of beloved records.',
    accent: '#ddae85',
  },
  {
    name: 'Moonflower Meadows',
    description: 'Quiet streets, flowers, and hidden gems.',
    accent: '#c5b4dd',
  },
  {
    name: 'Starlight Heights',
    description: 'An evening neighborhood for deeper discoveries.',
    accent: '#92b8d7',
  },
  {
    name: 'Cassette Corner',
    description: 'A little neighborhood with a lot of personality.',
    accent: '#e3b4c5',
  },
  {
    name: 'Echo Gardens',
    description: 'A growing collection of musical memories.',
    accent: '#a9c5a2',
  },
];

export interface ArtistDistrict {
  id: string;
  name: string;
  description: string;
  accent: string;
  firstRank: number;
  lastRank: number;
  artists: LastFmArtist[];
}

/**
 * Accepts artists in chart/rank order, typically from Last.fm.
 * Districts are rank-based rather than genre-based; genre
 * neighborhoods will require additional data later.
 */
export function createArtistDistricts(
  rankedArtists: readonly LastFmArtist[],
  districtSize = ARTISTS_PER_DISTRICT
): ArtistDistrict[] {
  if (!Number.isInteger(districtSize) || districtSize < 1) {
    throw new Error('District size must be a positive integer.');
  }

  // Keep the chart order, but avoid duplicate/blank artist lots.
  const uniqueArtists: LastFmArtist[] = [];
  const seen = new Set<string>();

  for (const artist of rankedArtists) {
    const name = artist.name?.trim();
    if (!name) continue;

    const key = name.normalize('NFKC').toLocaleLowerCase('en-US');
    if (seen.has(key)) continue;

    seen.add(key);
    uniqueArtists.push(artist);
  }

  const districts: ArtistDistrict[] = [];

  for (let start = 0; start < uniqueArtists.length; start += districtSize) {
    const index = districts.length;
    const artists = uniqueArtists.slice(start, start + districtSize);
    const theme = DISTRICT_THEMES[index] ?? {
      name: `Outer Borough ${index - DISTRICT_THEMES.length + 1}`,
      description: 'More streets to explore as the city grows.',
      accent: '#adc5b7',
    };

    districts.push({
      id: `district-${index + 1}`,
      name: theme.name,
      description: theme.description,
      accent: theme.accent,
      firstRank: start + 1,
      lastRank: start + artists.length,
      artists,
    });
  }

  return districts;
}
