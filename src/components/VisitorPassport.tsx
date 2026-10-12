import { useEffect, useRef, type CSSProperties } from 'react';

import type { ArtistDistrict } from '../lib/cityDistricts';
import type { PassportStamp } from '../lib/passport';
import { ACHIEVEMENTS, type AchievementProgress } from '../lib/achievements';

interface VisitorPassportProps {
  username: string;
  districts: ArtistDistrict[];
  activeDistrictIndex: number;
  stamps: PassportStamp[];
  achievements: AchievementProgress;
  onTravelToDistrict: (index: number) => void;
  onClose: () => void;
  travelDisabled?: boolean;
}

const districtIcons: Record<string, string> = {
  'district-1': '🏛️',
  'district-2': '🌿',
  'district-3': '💿',
  'district-4': '🌙',
  'district-5': '✨',
  'district-6': '📼',
  'district-7': '🌷',
};

function stampDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

export default function VisitorPassport({
  username,
  districts,
  activeDistrictIndex,
  stamps,
  achievements,
  onTravelToDistrict,
  onClose,
  travelDisabled = false,
}: VisitorPassportProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const seen = new Map(stamps.map((stamp) => [stamp.districtId, stamp]));
  const visitedCount = districts.filter((district) => seen.has(district.id)).length;
  const allVisited = districts.length > 0 && visitedCount === districts.length;
  const percent = districts.length
    ? Math.round((visitedCount / districts.length) * 100)
    : 0;

  const earnedById = new Map(achievements.earned.map((item) => [item.id, item]));
  const totalBadges = ACHIEVEMENTS.length;
  const badgeCount = achievements.earned.length;

  return (
    <div className="passport-overlay">
      <section
        className="passport-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passport-title"
      >
        <header className="passport-header">
          <div>
            <span>✿ SCROBBLE CITY TOURISM BOARD ✿</span>
            <h2 id="passport-title">📖 Your Musical Passport</h2>
            <p>Every neighborhood has a story. Collect them all!</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="passport-close"
            aria-label="Close Musical Passport"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="passport-content">
          <div className="passport-document">
            <div className="passport-document-top">
              <div className="passport-crest" aria-hidden="true">♫</div>
              <div>
                <span className="passport-overline">OFFICIAL EXPLORER REGISTRATION</span>
                <h3>{username}</h3>
                <p>Honorary citizen &amp; neighborhood wanderer</p>
              </div>
            </div>

            <div className="passport-progress-heading">
              <div>
                <span className="passport-overline">YOUR COLLECTION</span>
                <strong>{visitedCount} of {districts.length} stamps</strong>
              </div>
              <span className="passport-percentage">{percent}%</span>
            </div>
            <div
              className="passport-progress-track"
              role="progressbar"
              aria-label="Neighborhood passport completion"
              aria-valuemin={0}
              aria-valuemax={districts.length}
              aria-valuenow={visitedCount}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
            <p className="passport-hint">
              A stamp is awarded the first time you visit a district.
              Returning to a district keeps your original date.
            </p>

            <div className="passport-stamp-grid">
              {districts.map((district, index) => {
                const visit = seen.get(district.id);
                const isCurrent = index === activeDistrictIndex;
                return (
                  <article
                    key={district.id}
                    className={[
                      'passport-stamp-card',
                      visit ? 'passport-stamp-card--visited' : '',
                      isCurrent ? 'passport-stamp-card--current' : '',
                    ].filter(Boolean).join(' ')}
                    style={{ '--passport-accent': district.accent } as CSSProperties}
                  >
                    <div className="passport-stamp-art" aria-hidden="true">
                      <span>{districtIcons[district.id] ?? '🎵'}</span>
                      <small>{visit ? 'STAMPED' : 'UNVISITED'}</small>
                    </div>
                    <div className="passport-stamp-details">
                      <strong>{district.name}</strong>
                      <small>Artist ranks #{district.firstRank}–{district.lastRank}</small>
                      <span className={visit ? 'passport-date--earned' : 'passport-date--missing'}>
                        {visit ? `✓ ${stampDate(visit.stampedAt)}` : '☆ Awaiting your visit'}
                      </span>
                      <button
                        type="button"
                        disabled={travelDisabled}
                        onClick={() => {
                          if (isCurrent) {
                            onClose();
                          } else {
                            onTravelToDistrict(index);
                          }
                        }}
                      >
                        {isCurrent ? '📍 You are here' : visit ? '↗ Revisit district' : '🚋 Visit & stamp'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className={`passport-reward ${allVisited ? 'passport-reward--unlocked' : ''}`}>
              <span aria-hidden="true">{allVisited ? '🏆' : '🔒'}</span>
              <div>
                <span className="passport-overline">THE GRAND TOUR</span>
                <strong>{allVisited ? 'Master of Musical Neighborhoods!' : 'Master Explorer stamp locked'}</strong>
                <p>
                  {allVisited
                    ? 'Every currently available neighborhood has been explored. The Tourism Board salutes you!'
                    : `Visit ${districts.length - visitedCount} more neighborhood${districts.length - visitedCount === 1 ? '' : 's'} to finish the tour.`}
                </p>
              </div>
            </div>

            <section className="achievement-collection" aria-labelledby="achievement-heading">
              <div className="achievement-collection-top">
                <div>
                  <span className="passport-overline">✦ THE ACHIEVEMENT GUILD ✦</span>
                  <h3 id="achievement-heading">Your Musical Accomplishments</h3>
                  <p>Earn badges for exploring the city and meeting its residents.</p>
                </div>
                <strong>{badgeCount} / {totalBadges} badges</strong>
              </div>
              <div className="achievement-badge-grid">
                {ACHIEVEMENTS.map((badge) => {
                  const earned = earnedById.get(badge.id);
                  return (
                    <article key={badge.id}
                      className={`achievement-badge ${earned ? 'achievement-badge--earned' : 'achievement-badge--locked'}`}>
                      <span className="achievement-badge-icon" aria-hidden="true">{earned ? badge.icon : '🔒'}</span>
                      <div>
                        <strong>{badge.name}</strong>
                        <p>{badge.description}</p>
                        <small>{earned
                          ? `✓ Unlocked ${stampDate(earned.earnedAt)}`
                          : badge.id === 'social-butterfly'
                            ? `☆ ${Math.min(achievements.residentIds.length, 5)} of 5 different residents`
                            : badge.id === 'through-decades'
                              ? `☆ ${Math.min(achievements.calendarYears.length, 3)} of 3 calendar years studied${achievements.calendarYears.length ? ` (${achievements.calendarYears.join(', ')})` : ''}`
                              : '☆ Not earned yet'}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <p className="passport-disclaimer">
            Stamps are saved in this browser for this Last.fm username, across listening eras.
            They are not synced across browsers or devices. Demo cities have separate passports.
          </p>
        </div>
        <footer className="passport-footer">
          SCROBBLE CITY TOURISM BOARD • EST. 2026
        </footer>
      </section>
    </div>
  );
}
