
import { useEffect, useState } from 'react';

import type { CityData } from '../types/city';
import type { LastFmPeriod } from '../types/lastfm';
import type { HistoricalProgress } from '../lib/historicalStats';
import { periodLabels } from '../lib/periodLabels';

/* =========================================
   MUSIC TIME MACHINE - PROPS
========================================= */

interface MusicTimeMachineProps {
  city: CityData;
  currentPeriod: LastFmPeriod;
  loading: boolean;
  error: string;
  demo: boolean;

  onTravel: (period: LastFmPeriod) => Promise<void>;
  onClose: () => void;

  // Advanced historical travel
  historicalEraLabel: string | null;
  historicalProgress: HistoricalProgress | null;

  onHistoricalTravel: (
    startDate: Date,
    endDate: Date,
    label: string
  ) => Promise<void>;
}

/* =========================================
   QUICK TRAVEL PERIODS
========================================= */



const destinations: {
  value: LastFmPeriod;
  description: string;
  icon: string;
}[] = [
  {
    value: 'overall',
    description: 'Your all-time favorites.',
    icon: '🏛️',
  },
  {
    value: '12month',
    description: 'A whole year of music.',
    icon: '🌳',
  },
  {
    value: '6month',
    description: 'Half a year of favorites.',
    icon: '🍂',
  },
  {
    value: '3month',
    description: 'Your recent musical era.',
    icon: '🌸',
  },
  {
    value: '1month',
    description: 'Your current obsessions.',
    icon: '🌙',
  },
  {
    value: '7day',
    description: 'The soundtrack of your week.',
    icon: '✨',
  },
];

/* =========================================
   DATE HANDLING
========================================= */

// Convert a YYYY-MM-DD string to UTC midnight.
function parseUTCDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Please enter a valid date.');
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error('Please enter a valid calendar date.');
  }

  return date;
}

/* =========================================
   MUSIC TIME MACHINE COMPONENT
========================================= */

export default function MusicTimeMachine({
  city,
  currentPeriod,
  loading,
  error,
  demo,
  onTravel,
  onClose,
  historicalEraLabel,
  historicalProgress,
  onHistoricalTravel,
}: MusicTimeMachineProps) {

  /* =====================================
     QUICK TRAVEL STATE
  ===================================== */

  const [destination, setDestination] =
    useState<LastFmPeriod>(currentPeriod);

  /* =====================================
     HISTORICAL TRAVEL STATE
  ===================================== */

  const currentYear = new Date().getUTCFullYear();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const today = new Date().toISOString().slice(0, 10);

  const [historicalMode, setHistoricalMode] =
    useState<'year' | 'month' | 'custom'>('year');

  const [historicalYear, setHistoricalYear] =
    useState(String(currentYear - 1));

  const [historicalMonth, setHistoricalMonth] =
    useState(currentMonth);

  const [historicalStart, setHistoricalStart] =
    useState(`${currentYear}-01-01`);

  const [historicalEnd, setHistoricalEnd] =
    useState(today);

  const [
    historicalValidationError,
    setHistoricalValidationError,
  ] = useState('');

  /* =====================================
     ESCAPE KEY HANDLING
  ===================================== */

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [loading, onClose]);

  /* =====================================
     HISTORICAL DATE VALIDATION
  ===================================== */

  function handleHistoricalDeparture() {
    try {
      let startDate: Date;
      let endDate: Date;
      let label: string;

      /* -----------------------------
         CALENDAR YEAR
      ----------------------------- */

      if (historicalMode === 'year') {
        const year = Number(historicalYear);

        if (
          !historicalYear.trim() ||
          !Number.isInteger(year) ||
          year < 2002 ||
          year > currentYear
        ) {
          throw new Error(
            'Please select a valid historical year.'
          );
        }

        startDate = new Date(
          Date.UTC(year, 0, 1)
        );

        endDate = new Date(
          Date.UTC(year + 1, 0, 1)
        );

        label = String(year);

      /* -----------------------------
         CALENDAR MONTH
      ----------------------------- */

      } else if (historicalMode === 'month') {
        const match =
          /^(\d{4})-(\d{2})$/.exec(historicalMonth);

        if (!match) {
          throw new Error(
            'Please select a valid month.'
          );
        }

        const year = Number(match[1]);
        const month = Number(match[2]);

        if (
          year < 2002 ||
          year > currentYear ||
          month < 1 ||
          month > 12 ||
          (
            year === currentYear &&
            month > new Date().getUTCMonth() + 1
          )
        ) {
          throw new Error(
            'Please select a valid past or current month.'
          );
        }

        startDate = new Date(
          Date.UTC(year, month - 1, 1)
        );

        endDate = new Date(
          Date.UTC(year, month, 1)
        );

        label = startDate.toLocaleDateString(
          'en-US',
          {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          }
        );

      /* -----------------------------
         CUSTOM DATE RANGE
      ----------------------------- */

      } else {
        startDate = parseUTCDate(
          historicalStart
        );

        const lastDay = parseUTCDate(
          historicalEnd
        );

        if (lastDay < startDate) {
          throw new Error(
            'The end date must be on or after the start date.'
          );
        }

        if (startDate.getTime() > Date.now()) {
          throw new Error(
            'The start date cannot be in the future.'
          );
        }

        if (lastDay.getTime() > Date.now()) {
          throw new Error(
            'The end date cannot be in the future.'
          );
        }

        // Include the entire selected final day.
        // Our historical API uses an exclusive end date.
        endDate = new Date(
          lastDay.getTime() + 24 * 60 * 60 * 1000
        );

        label = `${historicalStart} to ${historicalEnd}`;
      }

      // Never request listening data beyond now.
      // This also supports the current year/month.
      const now = Date.now();

      if (startDate.getTime() > now) {
        throw new Error(
          'The selected period has not started yet.'
        );
      }

      if (endDate.getTime() > now) {
        endDate = new Date(now);
      }

      if (endDate <= startDate) {
        throw new Error(
          'The selected date range is empty.'
        );
      }

      setHistoricalValidationError('');

      // App.tsx performs the actual API request.
      void onHistoricalTravel(
        startDate,
        endDate,
        label
      );

    } catch (err) {
      setHistoricalValidationError(
        err instanceof Error
          ? err.message
          : 'Invalid historical destination.'
      );
    }
  }

  /* =====================================
     COMPONENT INTERFACE
  ===================================== */

  return (
    <div className="time-machine-overlay">
      <section
        className="time-machine-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="time-machine-title"
      >

        {/* =============================
            CLOCK TOWER HEADER
        ============================= */}

        <header className="time-machine-header">
          <div>
            <span>
              SCROBBLE CITY CLOCK TOWER
            </span>

            <h2 id="time-machine-title">
              The Music Time Machine
            </h2>

            <p>
              Yesterday's obsessions.
              Today's skyscrapers.
            </p>
          </div>

          <button
            type="button"
            className="time-machine-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close Music Time Machine"
          >
            ✕
          </button>
        </header>

        <div className="time-machine-content">

          {/* =============================
              TRANSPORTATION OFFICE
          ============================= */}

          <div className="time-machine-clock">
            <span className="time-machine-clock-icon">
              🕰️
            </span>

            <div>
              <strong>
                TEMPORAL TRANSPORTATION OFFICE
              </strong>

              <p>
                All departures subject to musical nostalgia.
              </p>
            </div>
          </div>

          {/* =============================
              PASSENGER TICKET
          ============================= */}

          <div className="time-machine-ticket">
            <span>PASSENGER</span>

            <strong>
              {city.username}
            </strong>

            <span>CURRENT ERA</span>

            <strong>
              {historicalEraLabel ??
                periodLabels[currentPeriod]}
            </strong>
          </div>

          {/* =============================
              QUICK TRAVEL
          ============================= */}

          <h3>
            Where would you like to travel?
          </h3>

          <p className="time-machine-description">
            Choose a listening period to reconstruct
            your city using the artists you listened
            to most during that time.
          </p>

          <div className="time-machine-destinations">
            {destinations.map((option) => (
              <button
                type="button"
                key={option.value}
                className={
                  'time-machine-destination ' +
                  (
                    destination === option.value
                      ? 'time-machine-destination--selected'
                      : ''
                  )
                }
                onClick={() =>
                  setDestination(option.value)
                }
                disabled={loading}
                aria-pressed={
                  destination === option.value
                }
              >
                <span className="destination-icon">
                  {option.icon}
                </span>

                <strong>
                  {periodLabels[option.value]}
                </strong>

                <small>
                  {option.description}
                </small>

                {destination === option.value && (
                  <span className="destination-selected">
                    ✓ SELECTED
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Demo notice */}

          {demo && (
            <p className="time-machine-notice">
              This city contains sample artists.
              Enter a real Last.fm username to use
              the Time Machine.
            </p>
          )}

          {/* API errors */}

          {error && (
            <div
              className="time-machine-error"
              role="alert"
            >
              ⚠️ {error}
            </div>
          )}

          {/* Quick travel button */}

          <div className="time-machine-controls">
            <button
              type="button"
              className="time-machine-travel"
              disabled={loading || demo}
              onClick={() => {
                void onTravel(destination);
              }}
            >
              {loading
                ? '⏳ REBUILDING CITY...'
                : '🚂 TRAVEL TO THIS ERA →'}
            </button>
          </div>

          <p className="time-machine-disclaimer">
            Quick Travel periods are relative to today.
            For specific historical dates, use the
            archives below.
          </p>

          {/* =============================
              HISTORICAL ARCHIVES
          ============================= */}

          <section className="historical-travel">

            <div className="historical-heading">
              <span>
                ✦ HISTORICAL ARCHIVES ✦
              </span>

              <h3>
                Travel to a Specific Date
              </h3>

              <p>
                Reconstruct Scrobble City from a
                particular year, month, or custom period.
              </p>
            </div>

            {/* -----------------------------
                HISTORICAL MODE SELECTOR
            ----------------------------- */}

            <div className="historical-mode-selector">
              <button
                type="button"
                className={
                  historicalMode === 'year'
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  setHistoricalMode('year');
                  setHistoricalValidationError('');
                }}
                disabled={loading}
                aria-pressed={historicalMode === 'year'}
              >
                📅 Year
              </button>

              <button
                type="button"
                className={
                  historicalMode === 'month'
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  setHistoricalMode('month');
                  setHistoricalValidationError('');
                }}
                disabled={loading}
                aria-pressed={historicalMode === 'month'}
              >
                🌙 Month
              </button>

              <button
                type="button"
                className={
                  historicalMode === 'custom'
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  setHistoricalMode('custom');
                  setHistoricalValidationError('');
                }}
                disabled={loading}
                aria-pressed={historicalMode === 'custom'}
              >
                🗓️ Custom
              </button>
            </div>

            {/* -----------------------------
                HISTORICAL INPUT FIELDS
            ----------------------------- */}

            <div className="historical-fields">

              {/* YEAR SELECTION */}

              {historicalMode === 'year' && (
                <label>
                  Destination Year

                  <input
                    type="number"
                    min="2002"
                    max={currentYear}
                    step="1"
                    value={historicalYear}
                    onChange={(event) =>
                      setHistoricalYear(
                        event.target.value
                      )
                    }
                    disabled={loading}
                  />
                </label>
              )}

              {/* MONTH SELECTION */}

              {historicalMode === 'month' && (
                <label>
                  Destination Month

                  <input
                    type="month"
                    min="2002-01"
                    max={currentMonth}
                    value={historicalMonth}
                    onChange={(event) =>
                      setHistoricalMonth(
                        event.target.value
                      )
                    }
                    disabled={loading}
                  />
                </label>
              )}

              {/* CUSTOM DATE SELECTION */}

              {historicalMode === 'custom' && (
                <div className="historical-date-row">
                  <label>
                    From

                    <input
                      type="date"
                      value={historicalStart}
                      max={today}
                      onChange={(event) =>
                        setHistoricalStart(
                          event.target.value
                        )
                      }
                      disabled={loading}
                    />
                  </label>

                  <label>
                    Through

                    <input
                      type="date"
                      value={historicalEnd}
                      max={today}
                      onChange={(event) =>
                        setHistoricalEnd(
                          event.target.value
                        )
                      }
                      disabled={loading}
                    />
                  </label>
                </div>
              )}

            </div>

            {/* -----------------------------
                VALIDATION ERRORS
            ----------------------------- */}

            {historicalValidationError && (
              <p
                className="historical-error"
                role="alert"
              >
                ⚠️ {historicalValidationError}
              </p>
            )}

            {/* -----------------------------
                LOADING PROGRESS
            ----------------------------- */}

            {loading && historicalProgress && (
              <div
                className="historical-progress"
                role="status"
                aria-live="polite"
              >
                <strong>
                  Searching the archives...
                </strong>

                <p>
                  Pages fetched:
                  {' '}
                  {historicalProgress.pagesFetched}
                  {' / '}
                  {historicalProgress.totalPages}
                </p>

                <p>
                  Scrobbles processed:
                  {' '}
                  {historicalProgress.scrobblesProcessed.toLocaleString()}
                </p>

                <progress
                  value={historicalProgress.pagesFetched}
                  max={Math.max(
                    1,
                    historicalProgress.totalPages
                  )}
                />
              </div>
            )}

            {/* -----------------------------
                HISTORICAL TRAVEL BUTTON
            ----------------------------- */}

            <button
              type="button"
              className="historical-departure-button"
              onClick={handleHistoricalDeparture}
              disabled={loading || demo}
            >
              {loading
                ? '⏳ SEARCHING HISTORY...'
                : '🕰️ TRAVEL TO THIS DATE →'}
            </button>

            {/* Demo restriction */}

            {demo && (
              <p className="historical-note">
                Historical travel requires real
                Last.fm listening data.
              </p>
            )}

            <p className="historical-note">
              Large listening histories may take longer
              to process. The current archive reader
              supports up to 200 pages per date range.
            </p>

            <p className="historical-note">
              Historical date boundaries currently
              use UTC.
            </p>

          </section>
        </div>

        {/* =============================
            FOOTER
        ============================= */}

        <footer className="time-machine-footer">
          SCROBBLE CITY TEMPORAL AUTHORITY • EST. 2026
        </footer>

      </section>
    </div>
  );
}
