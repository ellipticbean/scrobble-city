
import { useState } from 'react';

import type { HistoricalProgress } from '../lib/historicalStats';

interface HistoricalTimelineProps {
  currentEraLabel: string;
  initialYear: number;
  loading: boolean;
  error: string;
  progress: HistoricalProgress | null;

  onTravel: (
    startDate: Date,
    endDate: Date,
    label: string
  ) => Promise<void>;
}

const FIRST_YEAR = 2002;

export default function HistoricalTimeline({
  currentEraLabel,
  initialYear,
  loading,
  error,
  progress,
  onTravel,
}: HistoricalTimelineProps) {
  const currentYear = new Date().getUTCFullYear();

  const [selectedYear, setSelectedYear] = useState(
    initialYear
  );

  const years = Array.from(
    { length: currentYear - FIRST_YEAR + 1 },
    (_, index) => FIRST_YEAR + index
  );

  const alreadyViewing =
    currentEraLabel === String(selectedYear);

  function visitYear(year: number) {
    if (
      loading ||
      year < FIRST_YEAR ||
      year > currentYear
    ) {
      return;
    }

    setSelectedYear(year);

    if (currentEraLabel === String(year)) {
      return;
    }

    const startDate = new Date(
      Date.UTC(year, 0, 1)
    );

    const endOfYear = Date.UTC(
      year + 1, 0, 1
    );

    // Do not request future scrobbles.
    const endDate = new Date(
      Math.min(endOfYear, Date.now())
    );

    void onTravel(
      startDate,
      endDate,
      String(year)
    );
  }

  return (
    <section className="historical-timeline">
      <div className="timeline-heading">
        <div>
          <span>🕰️ TEMPORAL NAVIGATION SYSTEM</span>

          <h3>Your Musical Timeline</h3>

          <p>
            Choose a year to see how your
            little musical world has changed.
          </p>
        </div>

        <div className="timeline-current-era">
          <span>YOU ARE CURRENTLY VISITING</span>
          <strong>{currentEraLabel}</strong>
        </div>
      </div>

      <div className="timeline-year-display">
        <span>SELECTED DESTINATION</span>

        <strong>{selectedYear}</strong>

        <p>
          {alreadyViewing
            ? 'You are already visiting this year.'
            : `Ready to explore your music from ${selectedYear}?`}
        </p>
      </div>

      <div className="timeline-slider-row">
        <button
          type="button"
          className="timeline-arrow"
          disabled={
            loading || selectedYear <= FIRST_YEAR
          }
          onClick={() => visitYear(selectedYear - 1)}
          aria-label="Travel to previous year"
          title="Travel to previous year"
        >
          ◀
        </button>

        <div className="timeline-slider-container">
          <input
            type="range"
            min={FIRST_YEAR}
            max={currentYear}
            step={1}
            value={selectedYear}
            disabled={loading}
            onChange={(event) => {
              setSelectedYear(
                Number(event.target.value)
              );
            }}
            aria-label="Select historical year"
          />

          <div className="timeline-slider-labels">
            <span>{FIRST_YEAR}</span>
            <span>{currentYear}</span>
          </div>
        </div>

        <button
          type="button"
          className="timeline-arrow"
          disabled={
            loading || selectedYear >= currentYear
          }
          onClick={() => visitYear(selectedYear + 1)}
          aria-label="Travel to next year"
          title="Travel to next year"
        >
          ▶
        </button>
      </div>

      <div className="timeline-year-shortcuts">
        {years.map((year) => (
          <button
            type="button"
            key={year}
            className={
              'timeline-year-button ' +
              (
                selectedYear === year
                  ? 'timeline-year-button--active'
                  : ''
              )
            }
            disabled={loading}
            onClick={() => setSelectedYear(year)}
            aria-pressed={selectedYear === year}
          >
            {year}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="timeline-travel-button"
        disabled={loading || alreadyViewing}
        onClick={() => visitYear(selectedYear)}
      >
        {loading
          ? '⏳ RECONSTRUCTING HISTORY...'
          : alreadyViewing
            ? '✓ ALREADY VISITING THIS YEAR'
            : `🚂 TRAVEL TO ${selectedYear} →`}
      </button>

      {loading && (
        <div className="timeline-loading" role="status">
          <strong>Consulting historical archives...</strong>

          {progress ? (
            <>
              <p>
                Pages retrieved:
                {' '}
                {progress.pagesFetched}
                {' / '}
                {progress.totalPages}
              </p>

              <p>
                Scrobbles processed:
                {' '}
                {progress.scrobblesProcessed.toLocaleString()}
              </p>

              <progress
                value={progress.pagesFetched}
                max={Math.max(1, progress.totalPages)}
              />
            </>
          ) : (
            <p>Contacting Last.fm...</p>
          )}
        </div>
      )}

      {!loading && error && (
        <p className="timeline-error" role="alert">
          ⚠️ {error}
        </p>
      )}

      <p className="timeline-footnote">
        Select a year using the slider or buttons,
        then travel to rebuild your city.
        The arrow buttons travel one year at a time.
        Years without recorded listening history
        may have no data.
      </p>
    </section>
  );
}
