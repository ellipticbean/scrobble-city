
import type { CityBuilding } from '../types/city';
import { lastFmArtistUrl } from '../lib/lastfmLinks';

interface InfoPanelProps {
  building: CityBuilding | null;
  demo?: boolean;
  onClose: () => void;
}

export default function InfoPanel({
  building,
  demo = false,
  onClose,
}: InfoPanelProps) {
  if (!building) {
    return (
      <aside className="info-panel">
        <div className="panel-heading">
          <span>📜 CITY GUIDE</span>
        </div>

        <h3>Welcome, traveler!</h3>

        <p>
          Every building in Scrobble City tells a
          story about your musical history.
        </p>

        <p>Choose a building to explore!</p>

        <div className="panel-guide">
          <p>🏛️ City Hall — Musical Affairs</p>
          <p>🕰️ Clock Tower — Time Machine</p>
          <p>💌 Matchmaking — Dating Profile</p>
          <p>📋 Census Office — City Evolution</p>
          <p>🎵 Artist Buildings — Your Favorites</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="info-panel">
      <div className="panel-heading">
        <span>
          {building.type === 'artist'
            ? '🎵 ARTIST DIRECTORY'
            : '🏛️ CITY LANDMARK'}
        </span>

        <button
          type="button"
          className="panel-close"
          onClick={onClose}
          aria-label="Close building information"
        >
          ✕
        </button>
      </div>

      <h3>{building.name}</h3>

      <p>{building.description}</p>

      {building.type === 'artist' ? (
        <div className="building-details">
          <div>
            <span>Artist Rank</span>
            <strong>#{building.rank}</strong>
          </div>

          <div>
            <span>Total Scrobbles</span>
            <strong>
              {building.playcount?.toLocaleString()}
            </strong>
          </div>

          <div>
            <span>Building Height</span>
            <strong>{building.stories} floors</strong>
          </div>
          {!demo && (
            <a
              className="lastfm-artist-link"
              href={lastFmArtistUrl(building.name)}
              target="_blank"
              rel="noopener noreferrer"
            >
              ♪ View this artist on Last.fm ↗
            </a>
          )}
        </div>
      ) : (
        <div className="landmark-message">
          <p>✨ SPECIAL DESTINATION ✨</p>
          <p>
            This building will become an interactive
            attraction in a future update!
          </p>
        </div>
      )}
    </aside>
  );
}
