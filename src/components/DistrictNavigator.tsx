import type { CSSProperties } from 'react';
import type { ArtistDistrict } from '../lib/cityDistricts';

interface DistrictNavigatorProps {
  districts: ArtistDistrict[];
  activeDistrictIndex: number;
  onSelectDistrict: (index: number) => void;
  disabled?: boolean;
}

export default function DistrictNavigator({
  districts,
  activeDistrictIndex,
  onSelectDistrict,
  disabled = false,
}: DistrictNavigatorProps) {
  const active = districts[activeDistrictIndex];
  if (!active) return null;

  const totalArtists = districts.reduce(
    (sum, district) => sum + district.artists.length, 0
  );

  return (
    <nav className="district-navigator" aria-label="Explore city neighborhoods">
      <div className="district-navigator-heading">
        <div>
          <span className="district-navigator-kicker">🗺️ SCROBBLE CITY TRANSIT</span>
          <h3>Explore the Neighborhoods</h3>
          <p>Every stop is another little piece of your musical world.</p>
        </div>
        <div className="district-navigator-population">
          <span>CITY POPULATION</span>
          <strong>{totalArtists} artists</strong>
          <small>{districts.length} neighborhood{districts.length === 1 ? '' : 's'}</small>
        </div>
      </div>

      <div className="district-current" style={{ '--district-accent': active.accent } as CSSProperties}>
        <div>
          <span>CURRENT STOP · {activeDistrictIndex + 1} OF {districts.length}</span>
          <strong>{active.name}</strong>
          <small>{active.description}</small>
        </div>
        <span className="district-current-ranks">♪ RANKS {active.firstRank}–{active.lastRank}</span>
      </div>

      <div className="district-stops">
        {districts.map((district, index) => (
          <button
            type="button"
            key={district.id}
            className={`district-stop ${index === activeDistrictIndex ? 'district-stop--active' : ''}`}
            style={{ '--district-accent': district.accent } as CSSProperties}
            aria-current={index === activeDistrictIndex ? 'location' : undefined}
            aria-label={`${district.name}, artists ranked ${district.firstRank} to ${district.lastRank}`}
            disabled={disabled}
            onClick={() => onSelectDistrict(index)}
          >
            <span className="district-stop-number">{String(index + 1).padStart(2, '0')}</span>
            <strong>{district.name}</strong>
            <small>#{district.firstRank}–{district.lastRank}</small>
          </button>
        ))}
      </div>

      <div className="district-navigator-footer">
        <button
          type="button"
          disabled={disabled || activeDistrictIndex === 0}
          onClick={() => onSelectDistrict(activeDistrictIndex - 1)}
        >
          ← Previous stop
        </button>
        <span>{active.name}</span>
        <button
          type="button"
          disabled={disabled || activeDistrictIndex >= districts.length - 1}
          onClick={() => onSelectDistrict(activeDistrictIndex + 1)}
        >
          Next stop →
        </button>
      </div>
    </nav>
  );
}
