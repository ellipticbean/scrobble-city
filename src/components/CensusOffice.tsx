
import { useEffect, useRef, useState } from 'react';

import {
  getCachedHistoricalArtistChart,
} from '../lib/historicalCache';

import {
  compareHistoricalCharts,
  type CityEvolutionReport,
  type EvolutionArtist,
} from '../lib/cityEvolution';

import type {
  HistoricalProgress,
} from '../lib/historicalStats';

interface CensusOfficeProps {
  username: string;
  onClose: () => void;
  onComparisonSuccess?: (earlierYear: number, laterYear: number) => void;
}

interface CensusProgress extends HistoricalProgress {
  year: number;
}

const FIRST_YEAR = 2002;

function getYearDates(year: number) {
  const startDate = new Date(Date.UTC(year, 0, 1));

  const endDate = new Date(
    Math.min(
      Date.UTC(year + 1, 0, 1),
      Date.now()
    )
  );

  return { startDate, endDate };
}

function formatRank(rank: number | null): string {
  return rank === null ? 'Not ranked' : `#${rank}`;
}

export default function CensusOffice({
  username,
  onClose,
  onComparisonSuccess,
}: CensusOfficeProps) {
  const currentYear = new Date().getUTCFullYear();

  const [beforeYear, setBeforeYear] = useState(2023);
  const [afterYear, setAfterYear] = useState(2025);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] =
    useState<CensusProgress | null>(null);

  const [report, setReport] =
    useState<CityEvolutionReport | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const years = Array.from(
    { length: currentYear - FIRST_YEAR + 1 },
    (_, index) => currentYear - index
  );

  function closeOffice() {
    controllerRef.current?.abort();
    onClose();
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        controllerRef.current?.abort();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      controllerRef.current?.abort();
    };
  }, [onClose]);

  function cancelComparison() {
    controllerRef.current?.abort();
    setLoading(false);
    setProgress(null);
    setError('Comparison cancelled.');
  }

  async function handleCompare() {
    if (loading) return;

    if (beforeYear >= afterYear) {
      setError(
        'The earlier year must come before the later year.'
      );
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError('');
    setReport(null);
    setProgress(null);

    try {
      const beforeDates = getYearDates(beforeYear);

      const beforeChart =
        await getCachedHistoricalArtistChart(
          username,
          beforeDates.startDate,
          beforeDates.endDate,
          {
            signal: controller.signal,
            onProgress: (value) => {
              if (!controller.signal.aborted) {
                setProgress({
                  year: beforeYear,
                  ...value,
                });
              }
            },
          }
        );

      if (beforeChart.totalScrobbles === 0) {
        throw new Error(
          `No scrobbles were found for ${beforeYear}.`
        );
      }

      if (controller.signal.aborted) return;

      const afterDates = getYearDates(afterYear);

      const afterChart =
        await getCachedHistoricalArtistChart(
          username,
          afterDates.startDate,
          afterDates.endDate,
          {
            signal: controller.signal,
            onProgress: (value) => {
              if (!controller.signal.aborted) {
                setProgress({
                  year: afterYear,
                  ...value,
                });
              }
            },
          }
        );

      if (afterChart.totalScrobbles === 0) {
        throw new Error(
          `No scrobbles were found for ${afterYear}.`
        );
      }

      if (controller.signal.aborted) return;

      const comparison = compareHistoricalCharts(
        beforeChart,
        afterChart,
        String(beforeYear),
        String(afterYear)
      );

      setReport(comparison);
      // Only a fully completed, non-cancelled year comparison unlocks badges.
      onComparisonSuccess?.(beforeYear, afterYear);

    } catch (err) {
      if (controller.signal.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : 'Could not compare these years.'
      );

    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setProgress(null);
      }

      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }

  const sections: {
    title: string;
    description: string;
    entries: EvolutionArtist[];
    detail: (artist: EvolutionArtist) => string;
  }[] = report ? [
    {
      title: '💚 Loyal Residents',
      description: 'Stayed in the top 15 during both years.',
      entries: report.loyalResidents,
      detail: (artist) =>
        `${formatRank(artist.beforeRank)} → ${formatRank(artist.afterRank)}`,
    },
    {
      title: '✨ New Arrivals',
      description: 'Entered the top 15 in the later year.',
      entries: report.newArrivals,
      detail: (artist) =>
        `${formatRank(artist.beforeRank)} → ${formatRank(artist.afterRank)}`,
    },
    {
      title: '📦 Departed Residents',
      description: 'Left the top 15 in the later year.',
      entries: report.departedResidents,
      detail: (artist) =>
        `${formatRank(artist.beforeRank)} → ${formatRank(artist.afterRank)}`,
    },
    {
      title: '📈 Rising Stars',
      description: 'Climbed the most ranking positions.',
      entries: report.risingStars,
      detail: (artist) =>
        `Up ${artist.rankChange ?? 0} places`,
    },
    {
      title: '📉 Falling Stars',
      description: 'Dropped the most ranking positions.',
      entries: report.fallingStars,
      detail: (artist) =>
        `Down ${Math.abs(artist.rankChange ?? 0)} places`,
    },
    {
      title: '🌱 Later-Only Artists',
      description:
        'Recorded in the later year but not the earlier one.',
      entries: report.laterOnlyArtists,
      detail: (artist) =>
        `${artist.afterScrobbles.toLocaleString()} scrobbles`,
    },
  ] : [];

  return (
    <div className="census-overlay">
      <section
        className="census-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="census-title"
      >
        <header className="census-header">
          <div>
            <span>SCROBBLE CITY MUNICIPAL RECORDS</span>
            <h2 id="census-title">
              The Census Office
            </h2>
            <p>
              Bureau of Population Changes & Musical Migration
            </p>
          </div>

          <button
            type="button"
            className="census-close"
            onClick={closeOffice}
            aria-label="Close Census Office"
          >
            ✕
          </button>
        </header>

        <div className="census-content">
          <div className="census-intro">
            <span>📋 OFFICIAL CITY CENSUS</span>
            <h3>How has your musical city changed?</h3>
            <p>
              Comparing the musical population of citizen
              {' '}<strong>{username}</strong>.
            </p>
          </div>

          <div className="census-year-fields">
            <label>
              EARLIER YEAR
              <select
                value={beforeYear}
                disabled={loading}
                onChange={(event) =>
                  setBeforeYear(Number(event.target.value))
                }
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <span className="census-compare-icon">⇄</span>

            <label>
              LATER YEAR
              <select
                value={afterYear}
                disabled={loading}
                onChange={(event) =>
                  setAfterYear(Number(event.target.value))
                }
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="census-actions">
            <button
              type="button"
              className="census-compare-button"
              disabled={loading}
              onClick={() => {
                void handleCompare();
              }}
            >
              {loading
                ? '⏳ EXAMINING CITY RECORDS...'
                : '📂 COMPARE MUSICAL ERAS →'}
            </button>

            {loading && (
              <button
                type="button"
                className="census-cancel-button"
                onClick={cancelComparison}
              >
                Cancel
              </button>
            )}
          </div>

          {loading && (
            <div className="census-progress" role="status">
              <strong>
                Searching the {progress?.year ?? beforeYear}
                {' '}archives...
              </strong>

              {progress && (
                <>
                  <p>
                    Pages: {progress.pagesFetched}
                    {' / '}{progress.totalPages}
                  </p>
                  <p>
                    Scrobbles processed:{' '}
                    {progress.scrobblesProcessed.toLocaleString()}
                  </p>
                  <progress
                    value={progress.pagesFetched}
                    max={Math.max(1, progress.totalPages)}
                  />
                </>
              )}
            </div>
          )}

          {error && (
            <p className="census-error" role="alert">
              ⚠️ {error}
            </p>
          )}

          {report && (
            <div className="census-report">
              <div className="census-report-heading">
                <div>
                  <span>OFFICIAL FINDINGS</span>
                  <h3>
                    {report.before.label} vs. {report.after.label}
                  </h3>
                </div>
                <span className="census-stamp">CERTIFIED</span>
              </div>

              <div className="census-stats">
                {[report.before, report.after].map((period) => (
                  <div key={period.label}>
                    <span>YEAR {period.label}</span>
                    <strong>
                      {period.totalScrobbles.toLocaleString()}
                      {' '}scrobbles
                    </strong>
                    <p>
                      {period.totalArtists.toLocaleString()}
                      {' '}unique artists
                    </p>
                    <p>Top artist: {period.topArtist ?? 'Unknown'}</p>
                  </div>
                ))}
              </div>

              <div className="census-shared">
                <strong>
                  {report.sharedArtistCount.toLocaleString()}
                </strong>
                <span>
                  artists appeared in both years' records
                </span>
              </div>

              <div className="census-categories">
                {sections.map((section) => (
                  <div className="census-category" key={section.title}>
                    <h4>{section.title}</h4>
                    <p>{section.description}</p>

                    {section.entries.length === 0 ? (
                      <p className="census-no-results">
                        No artists in this category.
                      </p>
                    ) : (
                      <ol>
                        {section.entries.slice(0, 10).map((artist) => (
                          <li key={artist.name}>
                            <span>{artist.name}</span>
                            <small>{section.detail(artist)}</small>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>

              <p className="census-disclaimer">
                New Arrivals means entering the top 15,
                not necessarily listening to an artist for
                the first time ever. Rankings are compared
                within each calendar year. The current year,
                if selected, contains only listening recorded
                so far.
              </p>
            </div>
          )}
        </div>

        <footer className="census-footer">
          SCROBBLE CITY CENSUS BUREAU • EST. 2026
        </footer>
      </section>
    </div>
  );
}
