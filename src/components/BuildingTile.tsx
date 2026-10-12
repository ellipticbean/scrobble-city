
import type { CSSProperties } from 'react';
import type { CityBuilding } from '../types/city';

interface BuildingTileProps {
  building: CityBuilding;
  onClick: (building: CityBuilding) => void;
}

type Architecture =
  | 'tower'
  | 'townhouse'
  | 'shop'
  | 'cottage';

// Pastel color palettes for artist buildings.
const palettes = [
  {
    wall: '#e8ad9c',
    roof: '#b66f79',
    shadow: '#8d536b',
    door: '#986256',
  },
  {
    wall: '#acd7b0',
    roof: '#6e9f7c',
    shadow: '#4d7a62',
    door: '#956d50',
  },
  {
    wall: '#eacb85',
    roof: '#ad8054',
    shadow: '#896242',
    door: '#82594a',
  },
  {
    wall: '#b9aade',
    roof: '#7e79b4',
    shadow: '#625e94',
    door: '#92718b',
  },
  {
    wall: '#94d4d5',
    roof: '#538fa8',
    shadow: '#41768b',
    door: '#866a66',
  },
  {
    wall: '#edb5cf',
    roof: '#bd759e',
    shadow: '#905b82',
    door: '#a26b77',
  },
];

// Turn an artist name into a consistent number.
function hashName(name: string): number {
  let hash = 7;

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function getArchitecture(stories: number): Architecture {
  if (stories >= 6) return 'tower';
  if (stories >= 4) return 'townhouse';
  if (stories >= 3) return 'shop';
  return 'cottage';
}

export default function BuildingTile({
  building,
  onClick,
}: BuildingTileProps) {
  // A custom CSS-pixel exterior for the enterable record shop. The shop's
  // grid location is supplied by cityGenerator like the other buildings.
  if (building.type === 'recordShop') {
    return (
      <button
        type="button"
        className="building building--recordShop"
        style={{
          gridColumn: `${building.x + 1} / span ${building.width}`,
          gridRow: `${building.y + 1} / span ${building.height}`,
        }}
        onClick={() => onClick(building)}
        title="Enter The Needle & Nook record shop"
        aria-label="Enter The Needle and Nook record shop"
      >
        <span className="record-shop-exterior" aria-hidden="true">
          <span className="record-shop-roof"><span className="record-shop-roof-vinyl" /></span>
          <span className="record-shop-awning" />
          <span className="record-shop-storefront">
            <span className="record-shop-display"><span className="record-shop-display-disc" /></span>
            <span className="record-shop-door"><span /></span>
          </span>
        </span>
        <span className="pixel-sign record-shop-name">THE NEEDLE &amp; NOOK</span>
        <span className="record-shop-entry-label">♪ OPEN · ENTER SHOP →</span>
      </button>
    );
  }

  const isArtist = building.type === 'artist';

  const architecture = isArtist
    ? getArchitecture(building.stories)
    : null;

  const palette = isArtist
    ? palettes[hashName(building.name) % palettes.length]
    : null;

  const houseHeight = 36 + building.stories * 9;

  const windowRows = Math.min(building.stories, 6);

  const houseStyle = {
    '--house-height': `${houseHeight}px`,
    ...(palette && {
      '--wall': palette.wall,
      '--roof': palette.roof,
      '--roof-shadow': palette.shadow,
      '--door': palette.door,
    }),
  } as CSSProperties;

  return (
    <button
      type="button"
      className={[
        'building',
        `building--${building.type}`,
        architecture ? `building--${architecture}` : '',
      ].join(' ')}
      style={{
        gridColumn: `${building.x + 1} / span ${building.width}`,
        gridRow: `${building.y + 1} / span ${building.height}`,
      }}
      onClick={() => onClick(building)}
      title={`Explore ${building.name}`}
      aria-label={`Explore ${building.name}`}
    >
      <span
        className="pixel-house"
        style={houseStyle}
        aria-hidden="true"
      >
        <span className="pixel-roof">
          {architecture === 'cottage' && (
            <span className="pixel-chimney" />
          )}

          {building.type === 'clockTower' && (
            <span className="pixel-clock-face" />
          )}

          {building.type === 'cityHall' && (
            <span className="pixel-city-seal">♫</span>
          )}

          {building.type === 'matchmakingAgency' && (
            <span className="pixel-heart-sign">♥</span>
          )}

          {/* District-specific roof art. The district CSS only styles
              this on artist buildings, never the four landmarks. */}
          {isArtist && (
            <span className="pixel-district-ornament" />
          )}
        </span>

        <span className="pixel-walls">
          <span className="pixel-windows">
            {Array.from(
              { length: windowRows },
              (_, index) => (
                <span
                  className="pixel-window-row"
                  key={index}
                >
                  <span className="pixel-window" />
                  <span className="pixel-window" />
                </span>
              )
            )}
          </span>

          {architecture === 'shop' && (
            <span className="pixel-awning" />
          )}

          {/* A narrow themed piece of facade trim. */}
          {isArtist && (
            <span className="pixel-district-facade" />
          )}

          <span className="pixel-door" />
        </span>
      </span>

      <span className="pixel-sign">
        {building.name}
      </span>

      {isArtist && (
        <span className="pixel-rank">
          #{building.rank} · {building.stories} floors
        </span>
      )}
    </button>
  );
}
