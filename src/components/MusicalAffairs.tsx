
import { useEffect, useState } from 'react';
import type { CityData } from '../types/city';

interface MusicalAffairsProps {
  city: CityData;
  onClose: () => void;
}

type Stage = 'intake' | 'report' | 'appeal';

export default function MusicalAffairs({
  city,
  onClose,
}: MusicalAffairsProps) {
  const [stage, setStage] = useState<Stage>('intake');

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const artists = city.buildings
    .filter((building) => building.type === 'artist')
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  const topArtist = artists[0];

  const totalPlays = artists.reduce(
    (sum, artist) => sum + (artist.playcount ?? 0),
    0
  );

  const topThreePlays = artists
    .slice(0, 3)
    .reduce(
      (sum, artist) => sum + (artist.playcount ?? 0),
      0
    );

  const concentration = totalPlays
    ? Math.round((topThreePlays / totalPlays) * 100)
    : 0;

  const verdict =
    concentration >= 55
      ? 'EXCESSIVE MUSICAL LOYALTY'
      : 'SUSPICIOUSLY DIVERSE TASTE';

  return (
    <div className="affairs-overlay">
      <section
        className="affairs-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="affairs-title"
      >
        <header className="affairs-header">
          <div>
            <span>SCROBBLE CITY MUNICIPAL GOVERNMENT</span>
            <h2 id="affairs-title">
              Department of Musical Affairs
            </h2>
            <p>Bureau of Listening Conduct & Public Taste</p>
          </div>

          <button
            type="button"
            className="affairs-close"
            onClick={onClose}
            aria-label="Close Department of Musical Affairs"
          >
            ✕
          </button>
        </header>

        <div className="affairs-paper">
          <div className="affairs-file-number">
            CASE FILE: SC-{city.username.toUpperCase()}
          </div>

          {stage === 'intake' && (
            <div className="affairs-content">
              <div className="affairs-stamp">
                UNDER INVESTIGATION
              </div>

              <h3>Official Summons</h3>

              <p>
                Dear Citizen <strong>{city.username}</strong>,
              </p>

              <p>
                Your recent application for residency in
                Scrobble City has triggered an automatic
                investigation by the Department of Musical
                Affairs.
              </p>

              <p>
                Our inspectors have identified several
                potentially suspicious patterns in your
                listening history.
              </p>

              <div className="affairs-evidence">
                <strong>PRELIMINARY FINDINGS</strong>
                <p>Artists examined: {artists.length}</p>
                <p>
                  Primary suspect: {topArtist?.name ?? 'Unknown'}
                </p>
                <p>
                  Recorded plays among examined artists:
                  {' '}{totalPlays.toLocaleString()}
                </p>
              </div>

              <p>
                Please proceed to the official evaluation.
                Refusal to cooperate may result in an
                extremely judgmental letter.
              </p>

              <button
                type="button"
                className="affairs-button"
                onClick={() => setStage('report')}
              >
                Review My Case File →
              </button>
            </div>
          )}

          {stage === 'report' && (
            <div className="affairs-content">
              <div className="affairs-stamp">
                OFFICIAL FINDINGS
              </div>

              <h3>Notice of Musical Violations</h3>

              <p>
                The following allegations have been
                prepared against citizen
                {' '}<strong>{city.username}</strong>.
              </p>

              <div className="affairs-charge">
                <span>CHARGE 001</span>
                <h4>Aggravated Artist Obsession</h4>
                <p>
                  Your most frequently played artist,
                  <strong> {topArtist?.name}</strong>,
                  has accumulated
                  {' '}{topArtist?.playcount?.toLocaleString()}
                  {' '}scrobbles.
                </p>
                <p className="affairs-comment">
                  The Department would like to remind you
                  that other artists do exist.
                </p>
              </div>

              <div className="affairs-charge">
                <span>CHARGE 002</span>
                <h4>Conspiracy of Three</h4>
                <p>
                  Your three most-played artists account for
                  {' '}<strong>{concentration}%</strong> of all
                  scrobbles among the {artists.length} artists
                  examined.
                </p>
                <p className="affairs-comment">
                  We have reason to believe a musical
                  inner circle has formed.
                </p>
              </div>

              <div className="affairs-charge">
                <span>CHARGE 003</span>
                <h4>Questionable Urban Development</h4>
                <p>
                  You have authorized the construction of
                  a {topArtist?.stories}-story building
                  dedicated to {topArtist?.name}.
                </p>
                <p className="affairs-comment">
                  City Planning has requested an explanation.
                </p>
              </div>

              <div className="affairs-verdict">
                <span>OFFICIAL VERDICT</span>
                <strong>{verdict}</strong>
              </div>

              <button
                type="button"
                className="affairs-button"
                onClick={() => setStage('appeal')}
              >
                File an Appeal →
              </button>
            </div>
          )}

          {stage === 'appeal' && (
            <div className="affairs-content">
              <div className="affairs-stamp">
                APPEAL DENIED
              </div>

              <h3>Response to Your Appeal</h3>

              <p>
                Dear {city.username},
              </p>

              <p>
                Your appeal was reviewed by the Committee
                for Unnecessary Musical Judgment.
              </p>

              <p>
                Following an extensive investigation
                lasting approximately three seconds,
                the Committee has decided to uphold
                all previous findings.
              </p>

              <div className="affairs-evidence">
                <strong>FINAL DISPOSITION</strong>
                <p>
                  You are hereby sentenced to continue
                  enjoying whatever music you want.
                </p>
                <p>
                  The Department remains disappointed
                  by its lack of actual authority.
                </p>
              </div>

              <button
                type="button"
                className="affairs-button"
                onClick={() => setStage('report')}
              >
                ← Review Case Again
              </button>
            </div>
          )}
        </div>

        <footer className="affairs-footer">
          OFFICIAL DOCUMENT • SCROBBLE CITY • EST. 2026
        </footer>
      </section>
    </div>
  );
}
