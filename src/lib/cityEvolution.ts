
import type {
  HistoricalArtistChart,
} from './historicalStats';

/* =========================================
   SCROBBLE CITY - CITY EVOLUTION
   Step 17.1: Historical comparison engine
========================================= */

interface ArtistSnapshot {
  name: string;
  rank: number;
  scrobbles: number;
}

export interface EvolutionArtist {
  name: string;
  beforeRank: number | null;
  afterRank: number | null;
  beforeScrobbles: number;
  afterScrobbles: number;

  // Positive = climbed in rank.
  // Negative = dropped in rank.
  // Null = absent from one period.
  rankChange: number | null;
}

export interface EvolutionPeriod {
  label: string;
  totalScrobbles: number;
  totalArtists: number;
  topArtist: string | null;
}

export interface CityEvolutionReport {
  before: EvolutionPeriod;
  after: EvolutionPeriod;

  loyalResidents: EvolutionArtist[];
  newArrivals: EvolutionArtist[];
  departedResidents: EvolutionArtist[];

  risingStars: EvolutionArtist[];
  fallingStars: EvolutionArtist[];

  // Present in the later period but absent
  // from the earlier period's records.
  laterOnlyArtists: EvolutionArtist[];

  // Artists who appear in both periods.
  sharedArtistCount: number;
}

/* =========================================
   NORMALIZE ARTIST NAMES
========================================= */

function normalizeName(name: string): string {
  return name
    .trim()
    .normalize('NFKC')
    .toLocaleLowerCase('en-US');
}

/* =========================================
   BUILD ARTIST LOOKUP TABLE
========================================= */

function buildArtistMap(
  chart: HistoricalArtistChart
): Map<string, ArtistSnapshot> {
  const map = new Map<string, ArtistSnapshot>();

  chart.artists.forEach((artist, index) => {
    const key = normalizeName(artist.name);

    if (!key) return;

    map.set(key, {
      name: artist.name,
      rank: index + 1,
      scrobbles: Number(artist.playcount) || 0,
    });
  });

  return map;
}

/* =========================================
   COMPARE TWO HISTORICAL PERIODS
========================================= */

export function compareHistoricalCharts(
  beforeChart: HistoricalArtistChart,
  afterChart: HistoricalArtistChart,
  beforeLabel: string,
  afterLabel: string
): CityEvolutionReport {
  const beforeMap = buildArtistMap(beforeChart);
  const afterMap = buildArtistMap(afterChart);

  // Combine every artist found in either period.
  const allArtistKeys = new Set([
    ...beforeMap.keys(),
    ...afterMap.keys(),
  ]);

  const allArtists: EvolutionArtist[] =
    Array.from(allArtistKeys).map((key) => {
      const before = beforeMap.get(key);
      const after = afterMap.get(key);

      const beforeRank = before?.rank ?? null;
      const afterRank = after?.rank ?? null;

      return {
        name: after?.name ?? before?.name ?? key,
        beforeRank,
        afterRank,
        beforeScrobbles: before?.scrobbles ?? 0,
        afterScrobbles: after?.scrobbles ?? 0,

        rankChange:
          beforeRank !== null &&
          afterRank !== null
            ? beforeRank - afterRank
            : null,
      };
    });

  /* =====================================
     TOP 15 MEMBERSHIP
  ===================================== */

  const beforeTop15 = new Set(
    beforeChart.artists
      .slice(0, 15)
      .map((artist) => normalizeName(artist.name))
  );

  const afterTop15 = new Set(
    afterChart.artists
      .slice(0, 15)
      .map((artist) => normalizeName(artist.name))
  );

  const loyalResidents: EvolutionArtist[] = [];
  const newArrivals: EvolutionArtist[] = [];
  const departedResidents: EvolutionArtist[] = [];

  for (const artist of allArtists) {
    const key = normalizeName(artist.name);

    const wasTop15 = beforeTop15.has(key);
    const isTop15 = afterTop15.has(key);

    if (wasTop15 && isTop15) {
      loyalResidents.push(artist);
    } else if (!wasTop15 && isTop15) {
      newArrivals.push(artist);
    } else if (wasTop15 && !isTop15) {
      departedResidents.push(artist);
    }
  }

  // Display rankings in a consistent order.
  loyalResidents.sort(
    (a, b) =>
      (a.afterRank ?? Infinity) -
      (b.afterRank ?? Infinity)
  );

  newArrivals.sort(
    (a, b) =>
      (a.afterRank ?? Infinity) -
      (b.afterRank ?? Infinity)
  );

  departedResidents.sort(
    (a, b) =>
      (a.beforeRank ?? Infinity) -
      (b.beforeRank ?? Infinity)
  );

  /* =====================================
     BIGGEST RANKING CHANGES
  ===================================== */

  // Compare artists ranked within the top 50
  // in at least one of the two periods.
  // This avoids letting obscure rank changes
  // dominate the main report.
  const comparableArtists = allArtists.filter(
    (artist) =>
      artist.beforeRank !== null &&
      artist.afterRank !== null &&
      (
        artist.beforeRank <= 50 ||
        artist.afterRank <= 50
      )
  );

  const risingStars = comparableArtists
    .filter(
      (artist) =>
        artist.rankChange !== null &&
        artist.rankChange > 0
    )
    .sort(
      (a, b) =>
        (b.rankChange ?? 0) -
        (a.rankChange ?? 0)
    )
    .slice(0, 10);

  const fallingStars = comparableArtists
    .filter(
      (artist) =>
        artist.rankChange !== null &&
        artist.rankChange < 0
    )
    .sort(
      (a, b) =>
        (a.rankChange ?? 0) -
        (b.rankChange ?? 0)
    )
    .slice(0, 10);

  /* =====================================
     ARTISTS ONLY IN THE LATER PERIOD
  ===================================== */

  const laterOnlyArtists = allArtists
    .filter(
      (artist) =>
        artist.beforeRank === null &&
        artist.afterRank !== null
    )
    .sort(
      (a, b) =>
        (a.afterRank ?? Infinity) -
        (b.afterRank ?? Infinity)
    )
    .slice(0, 10);

  /* =====================================
     RETURN THE CENSUS REPORT
  ===================================== */

  return {
    before: {
      label: beforeLabel,
      totalScrobbles: beforeChart.totalScrobbles,
      totalArtists: beforeChart.totalArtists,
      topArtist: beforeChart.artists[0]?.name ?? null,
    },

    after: {
      label: afterLabel,
      totalScrobbles: afterChart.totalScrobbles,
      totalArtists: afterChart.totalArtists,
      topArtist: afterChart.artists[0]?.name ?? null,
    },

    loyalResidents,
    newArrivals,
    departedResidents,
    risingStars,
    fallingStars,
    laterOnlyArtists,

    sharedArtistCount: allArtists.filter(
      (artist) =>
        artist.beforeRank !== null &&
        artist.afterRank !== null
    ).length,
  };
}
