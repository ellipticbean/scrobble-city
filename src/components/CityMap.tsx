import { useEffect, useState } from 'react';

import type {
    CityBuilding,
    CityData,
} from '../types/city';

import BuildingTile from './BuildingTile';
import Citizens from './Citizens';
import TownEventBoard from './TownEventBoard';
import { getTownEvent } from '../lib/townEvents';
import type { ArtistDistrict } from '../lib/cityDistricts';

interface CityMapProps {
    city: CityData;
    onSelectBuilding: (building: CityBuilding) => void;
    onOpenPassport: () => void;
    onOpenRecordShop: () => void;
    onReadNotice?: () => void;
    onTalkToCitizen?: (residentId: string) => void;
    onNightVisit?: () => void;
    district?: ArtistDistrict;
    totalArtists?: number;
}

type Decoration = {
    x: number;
    y: number;
    kind: 'tree' | 'flowers';
};

// Decorations avoid building tiles and the main avenue.
const decorations: Decoration[] = [
    { x: 0, y: 0, kind: 'tree' },
    { x: 3, y: 0, kind: 'flowers' },
    { x: 6, y: 0, kind: 'tree' },

    { x: 0, y: 1, kind: 'flowers' },

    { x: 0, y: 3, kind: 'tree' },
    { x: 2, y: 3, kind: 'flowers' },
    { x: 4, y: 3, kind: 'tree' },
    { x: 8, y: 3, kind: 'tree' },
    { x: 10, y: 3, kind: 'flowers' },

    { x: 0, y: 5, kind: 'flowers' },
    { x: 2, y: 5, kind: 'tree' },
    { x: 4, y: 5, kind: 'flowers' },
    { x: 8, y: 5, kind: 'flowers' },
    { x: 10, y: 5, kind: 'tree' },

    { x: 0, y: 7, kind: 'tree' },
    { x: 2, y: 7, kind: 'flowers' },
    { x: 4, y: 7, kind: 'tree' },
    { x: 8, y: 7, kind: 'tree' },
    { x: 10, y: 7, kind: 'flowers' },
];

// Each neighborhood has a distinctive atmosphere. The new motifs
// replace existing decorative tiles, so they never cover artist lots.
type DecorKind = Decoration['kind'] |
    'bush' | 'record' | 'moonflower' | 'lantern' |
    'star' | 'cassette' | 'sprout' | 'bouquet';

const MOODS: Record<string, string> = {
    'district-1': '☀️ A cheerful city center',
    'district-2': '🌿 A shady, leafy walkway',
    'district-3': '💿 A warm and colorful record district',
    'district-4': '🌙 A peaceful lavender garden',
    'district-5': '✨ Starlit streets and glowing lanterns',
    'district-6': '📼 A nostalgic neighborhood',
    'district-7': '🌷 A garden full of little melodies',
};

function districtDecorKind(
    kind: Decoration['kind'],
    districtId: string
): DecorKind {
    switch (districtId) {
        case 'district-2':
            return kind === 'tree' ? 'tree' : 'bush';
        case 'district-3':
            return kind === 'tree' ? 'record' : 'flowers';
        case 'district-4':
            return kind === 'tree' ? 'tree' : 'moonflower';
        case 'district-5':
            return kind === 'tree' ? 'lantern' : 'star';
        case 'district-6':
            return kind === 'tree' ? 'cassette' : 'sprout';
        case 'district-7':
            return kind === 'tree' ? 'bush' : 'bouquet';
        default:
            return kind;
    }
}

const roadRows = [2, 4, 6, 8];

/* ==========================================
   STEP 19.4: LIVING CITY ATMOSPHERE
   Manual modes are remembered on this device.
   Auto is based on approximate local clock hours,
   not astronomical sunrise or sunset.
========================================== */
type TimeChoice = 'auto' | 'day' | 'sunset' | 'night';
type TimeScene = Exclude<TimeChoice, 'auto'>;

const TIME_OPTIONS: { value: TimeChoice; label: string }[] = [
    { value: 'auto', label: '🕓 Auto' },
    { value: 'day', label: '☀️ Day' },
    { value: 'sunset', label: '🌇 Sunset' },
    { value: 'night', label: '🌙 Night' },
];

const FIREFLIES = [
    { x: 8, y: 17, delay: 0.2 },
    { x: 34, y: 8, delay: 2.3 },
    { x: 93, y: 14, delay: 1.1 },
    { x: 17, y: 43, delay: 3.2 },
    { x: 85, y: 49, delay: 0.8 },
    { x: 9, y: 73, delay: 2.7 },
    { x: 40, y: 77, delay: 1.8 },
    { x: 91, y: 82, delay: 3.8 },
];

function readStoredMode(): TimeChoice {
    try {
        const value = localStorage.getItem('scrobble-city-time-choice');
        if (value === 'day' || value === 'sunset' ||
            value === 'night' || value === 'auto') return value;
    } catch {
        // Some browsers disable local storage. Auto still works.
    }
    return 'auto';
}

function readPaused(): boolean {
    try {
        return localStorage.getItem('scrobble-city-pause-effects') === 'true';
    } catch {
        return false;
    }
}

function getClockScene(hour: number): TimeScene {
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'sunset';
    return 'night';
}

const SCENE_LABELS: Record<TimeScene, string> = {
    day: 'Sunny streets',
    sunset: 'Golden hour',
    night: 'Cozy nighttime',
};


export default function CityMap({
    city,
    onSelectBuilding,
    onOpenPassport,
    onOpenRecordShop,
    onReadNotice,
    onTalkToCitizen,
    onNightVisit,
    district,
    totalArtists,
}: CityMapProps) {
    const [timeChoice, setTimeChoice] = useState<TimeChoice>(readStoredMode);
    const [effectsPaused, setEffectsPaused] = useState(readPaused);
    const [posterSelection, setPosterSelection] = useState({ districtKey: '', preview: 0 });
    const [localHour, setLocalHour] = useState(() => new Date().getHours());

    // Auto mode refreshes when the visitor's clock crosses a time boundary.
    useEffect(() => {
        const updateClock = () => setLocalHour(new Date().getHours());
        updateClock();
        const interval = window.setInterval(updateClock, 60_000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        try { localStorage.setItem('scrobble-city-time-choice', timeChoice); }
        catch { /* Browsing without storage is still supported. */ }
    }, [timeChoice]);

    useEffect(() => {
        try { localStorage.setItem('scrobble-city-pause-effects', String(effectsPaused)); }
        catch { /* Browsing without storage is still supported. */ }
    }, [effectsPaused]);

    const scene: TimeScene = timeChoice === 'auto'
        ? getClockScene(localHour)
        : timeChoice;

    useEffect(() => {
        if (scene === 'night') onNightVisit?.();
    }, [scene, onNightVisit]);

    const districtId = district?.id ?? 'district-1';
    const districtKey = `${city.username}|${districtId}`;
    const eventPreview = posterSelection.districtKey === districtKey
        ? posterSelection.preview : 0;
    const townEvent = getTownEvent(city, district?.name ?? 'Town Center', eventPreview);
    const artistCount = city.buildings.filter(
        (building) => building.type === 'artist'
    ).length;

    return (
        <section className={[
            'city-wrapper',
            `district-theme--${districtId}`,
            `city-time--${scene}`,
            effectsPaused ? 'city-effects--paused' : '',
        ].filter(Boolean).join(' ')}>
            <header className="city-header">
                <div>
                    <span className="city-subtitle">
                        WELCOME TO
                    </span>

                    <h2>{city.username}'s Scrobble City</h2>

                    <p>
                        {district
                            ? `${district.name} — ${district.description}`
                            : 'A tiny musical world built from your listening history.'}
                    </p>
                    {district && (
                        <span className="district-mood-label">
                            {MOODS[districtId] ?? '🎵 A musical neighborhood'}
                        </span>
                    )}
                </div>

                <div className="city-population">
                    <span>♪ CITY DIRECTORY ♪</span>
                    <strong>{artistCount} Artists Here</strong>
                    {district && (
                        <small className="city-district-count">
                            Ranks {district.firstRank}–{district.lastRank}
                            {' · '}{totalArtists ?? artistCount} across city
                        </small>
                    )}
                </div>
            </header>

            <div className="city-ambience-toolbar">
                <div className="city-ambience-title">
                    <span>✨ CITY ATMOSPHERE</span>
                    <strong>{SCENE_LABELS[scene]}</strong>
                    <small>
                        {timeChoice === 'auto'
                            ? 'Auto uses your device’s approximate local time.'
                            : 'Manually selected — explore at your own pace.'}
                    </small>
                </div>
                <div className="city-ambience-actions">
                    <div className="city-ambience-modes" role="group" aria-label="Time of day">
                        {TIME_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                className={timeChoice === value ? 'is-selected' : ''}
                                aria-pressed={timeChoice === value}
                                onClick={() => setTimeChoice(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <label className="city-pause-effects">
                        <input
                            type="checkbox"
                            checked={effectsPaused}
                            onChange={(event) => setEffectsPaused(event.target.checked)}
                        />
                        Pause movement
                    </label>
                </div>
            </div>

            <TownEventBoard
                event={townEvent}
                preview={eventPreview}
                onNextEvent={() => setPosterSelection({
                    districtKey,
                    preview: (eventPreview + 1) % 4,
                })}
                onVisitArtist={onSelectBuilding}
                onReadNotice={onReadNotice}
            />

            <p className="city-mobile-pan-hint">↔ Swipe sideways to explore the whole neighborhood</p>
            <div className="city-map-container" tabIndex={0} role="region" aria-label="Scrollable pixel-art city map; swipe or use arrow keys to see more buildings">
                <div className="city-grid">

                    {/* Horizontal streets */}
                    {roadRows.map((row) => (
                        <div
                            key={`road-${row}`}
                            className="city-road"
                            style={{
                                gridColumn: '1 / -1',
                                gridRow: row + 1,
                            }}
                            aria-hidden="true"
                        />
                    ))}

                    {/* Main vertical avenue */}
                    <div
                        className="city-avenue"
                        style={{
                            gridColumn: '7',
                            gridRow: '4 / 11',
                        }}
                        aria-hidden="true"
                    />

                    {/* Town square */}
                    <div
                        className="city-plaza"
                        style={{
                            gridColumn: '5 / span 4',
                            gridRow: '3',
                        }}
                    >
                        <span className="plaza-planter plaza-planter--left" aria-hidden="true" />

                        <div className="plaza-center">
                            <span className="plaza-fountain">
                                <span className="plaza-water" />
                            </span>

                            <span className="plaza-sign">
                                SCROBBLE SQUARE
                            </span>
                        </div>

                        <span className="plaza-planter plaza-planter--right" aria-hidden="true" />
                        <button
                            type="button"
                            className="plaza-passport-kiosk"
                            onClick={onOpenPassport}
                            aria-label="Open your Scrobble City Visitor Passport"
                        >
                            📖 Passport
                        </button>
                        <span className="plaza-event-flag" aria-hidden="true">
                            {townEvent.icon} {townEvent.shortTitle}
                        </span>
                    </div>

                    {/* Ambient fireflies use absolute positions, not grid lots.
                        They cannot intercept clicks on artist buildings. */}
                    {FIREFLIES.map((firefly, index) => (
                        <span
                            key={`firefly-${index}`}
                            className="city-firefly"
                            style={{
                                left: `${firefly.x}%`,
                                top: `${firefly.y}%`,
                                animationDelay: `${firefly.delay}s`,
                            }}
                            aria-hidden="true"
                        />
                    ))}

                    {/* Trees and flowers */}
                    {decorations.map((decoration, index) => (
                        <div
                            key={`decor-${index}`}
                            className={`city-decor city-decor--${districtDecorKind(decoration.kind, districtId)}`}
                            style={{
                                gridColumn: decoration.x + 1,
                                gridRow: decoration.y + 1,
                            }}
                            aria-hidden="true"
                        />
                    ))}

                    {/* Animated citizens walking along the streets */}
                    <Citizens
                        city={city}
                        scene={scene}
                        townEvent={townEvent}
                        onSelectBuilding={onSelectBuilding}
                        onTalkToCitizen={onTalkToCitizen}
                    />

                    {/* Interactive buildings */}
                    {city.buildings.map((building) => (
                        <BuildingTile
                            key={building.id}
                            building={building}
                            onClick={onSelectBuilding}
                        />
                    ))}
                </div>
            </div>

            <footer className="city-footer">
                <span>🌳 Explore your musical neighborhood</span>
                <button type="button" className="record-shop-wayfinder" onClick={onOpenRecordShop}>💿 Find The Needle &amp; Nook →</button>
            </footer>
        </section>
    );
}
