import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CityBuilding, CityData } from '../types/city';
import type { TownEvent } from '../lib/townEvents';

/* Step 19.5B — strolling routines and interactive conversations.
   Fictional NPCs use real data from the buildings shown in this district.
   No additional Last.fm requests are needed. */

type CitizenScene = 'day' | 'sunset' | 'night';
type Hairstyle = 'short' | 'bob' | 'long' | 'bun' | 'spiky';
type Accessory = 'scarf' | 'glasses' | 'headphones' | 'satchel' | 'cap';

interface CitizensProps {
  city: CityData;
  onSelectBuilding: (building: CityBuilding) => void;
  scene?: CitizenScene;
  townEvent?: TownEvent;
  onTalkToCitizen?: (residentId: string) => void;
}

type CitizenStyle = CSSProperties & {
  '--citizen-shirt': string;
  '--citizen-skin': string;
  '--citizen-hair': string;
  '--citizen-pants': string;
  '--citizen-accent': string;
  '--walk-duration': string;
  '--walk-delay': string;
  '--walk-start': string;
  '--walk-middle': string;
  '--walk-end': string;
};

interface Citizen {
  id: string;
  artist: CityBuilding;
  nickname: string;
  persona: ResidentPersona;
  hairstyle: Hairstyle;
  accessory: Accessory;
  row: number;
  style: CitizenStyle;
}

type ResidentPersona = 'collector' | 'dreamer' | 'dj' | 'explorer' | 'superfan';

const PERSONALITIES: Record<ResidentPersona, { name: string; line: (artist: string) => string }> = {
  collector: { name: 'The Record Collector', line: (artist) => `I keep a pretend record shelf for ${artist}. My collection is getting ridiculous!` },
  dreamer: { name: 'The Daydreamer', line: (artist) => `Sometimes I imagine ${artist} playing a little show right here by the fountain.` },
  dj: { name: 'The Playlist Maker', line: (artist) => `I'm arranging a playlist around ${artist}. The transitions need to be perfect.` },
  explorer: { name: 'The Music Explorer', line: (artist) => `I wander from district to district looking for neighbors who also love ${artist}.` },
  superfan: { name: 'The Loyal Superfan', line: (artist) => `I've walked past ${artist}'s building so many times I could find it with my eyes closed.` },
};
const PERSONA_TYPES = Object.keys(PERSONALITIES) as ResidentPersona[];

const SKIN_COLORS = [
  '#f8d4b4', '#ecc19b', '#dba27d', '#be825f', '#946349', '#6c473a',
] as const;
const HAIR_COLORS = [
  '#4d394a', '#734d49', '#ab704d', '#d6ab69', '#363b54', '#886a77',
] as const;
const SHIRT_COLORS = [
  '#c77eab', '#8fb9a6', '#84add5', '#e0ad6d', '#b59bcc',
  '#d58c83', '#9ebf82', '#74b5ba',
] as const;
const PANTS_COLORS = [
  '#626b96', '#755b7a', '#567a7d', '#82675c', '#536b84',
] as const;
const HAIR_STYLES: Hairstyle[] = ['short', 'bob', 'long', 'bun', 'spiky'];
const ACCESSORIES: Accessory[] = ['scarf', 'glasses', 'headphones', 'satchel', 'cap'];
const NICKNAMES = [
  'Poppy', 'Juniper', 'Milo', 'Clover', 'Wren', 'Bee', 'Fern', 'Sunny',
  'Robin', 'Maple', 'Hazel', 'Rowan', 'Opal', 'Basil', 'Ivy', 'Felix',
  'Olive', 'Sage', 'Mabel', 'Theo', 'Dahlia', 'Jasper', 'Lottie', 'Kit',
  'Flora', 'Ellis', 'Nora', 'August', 'Cleo', 'Briar', 'Remy', 'Winnie',
  'Elsie', 'Otis', 'Ember', 'Pearl', 'Hugo', 'Luna', 'Finch', 'Tilly',
  'Arlo', 'Iris', 'Bonnie', 'Hugoette', 'Alba', 'Theolette', 'Niko', 'Ada',
  'Nell', 'Rue', 'Felixine', 'Cosmo', 'Dottie', 'Elio', 'Evie', 'Sylvie',
  'Alfie', 'Posy', 'Casper', 'Lumi', 'Oona', 'Percy', 'Pip', 'Juno',
  'Rory', 'Zelda', 'WinnieMae', 'Etta', 'Orla', 'Moss', 'Albie', 'Darcy',
  'Matilda', 'Saffron', 'Hollis', 'Indigo', 'Faye', 'Gideon', 'Lyra', 'Merritt',
  'Calla', 'Leonie', 'Leif', 'Nova', 'Oscar', 'Esme', 'Tess', 'Cedar',
  'Phoebe', 'Birdie', 'Sagebrush', 'Zinnia', 'Vesper', 'Ophelia', 'Yarrow', 'Lumiere',
  'Eden', 'Freya', 'Atlas', 'Pippa', 'Solstice', 'Imogen', 'Rumi', 'Pepper',
  'Margot', 'Astrid', 'Arthur', 'Cora', 'Isolde', 'Quincy', 'Ezra', 'Penelope',
  'Sylvan', 'Willa', 'Clementine', 'Marlowe', 'Bowie', 'Nellie', 'Persephone', 'Silas',
  'Clement', 'Blythe', 'Arden', 'Aster', 'Cassian', 'Daphne', 'Leon', 'Elodie',
  'Zephyr', 'Jude', 'Primrose', 'Laurel', 'Maeve', 'Sterling', 'Rafferty', 'Beryl',
  'Ari', 'Meadow', 'Cecily', 'Florian', 'Micah', 'Delphine', 'Nina', 'Violet',
  'Eira', 'Elowen', 'Azalea', 'Piers', 'Rhea', 'Soleil', 'Niamh', 'Bramble',
  'Keira', 'Finley', 'Winter', 'Gigi', 'Beatrix', 'Ingrid', 'Elmer',
] as const;

// A one-to-one permutation of global artist ranks prevents repeated names
// across ALL seven districts. Changing eras may change an artist's resident
// because the fictional citizen belongs to that chart position.
// 37 and 159 are coprime, so ranks 1-159 map to different names.
function residentName(artist: CityBuilding, seed: number): string {
  const rank = artist.rank;
  if (typeof rank === 'number' && Number.isInteger(rank) && rank >= 1) {
    const index = ((rank - 1) * 37) % NICKNAMES.length;
    const firstName = NICKNAMES[index];
    return rank <= NICKNAMES.length ? firstName : `${firstName} #${rank}`;
  }
  // Demo/legacy buildings without a rank still get a deterministic name.
  return NICKNAMES[(seed >>> 13) % NICKNAMES.length];
}

// A few artists from different rows make the streets feel populated.
// The last district may contain fewer than 15 artists; that's fine.
const RESIDENT_INDEXES = [0, 5, 10, 3, 8];
const CROSSROADS_X = 58;

function stableHash(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// The city grid contains 11 columns of 76px, 8px gaps and 20px padding.
// Place each citizen's stop on the road directly below their artist's lot.
function artistStopPercent(artist: CityBuilding): number {
  const gridWidth = 11 * 76 + 10 * 8 + 40;
  const columnCenter = 20 + artist.x * (76 + 8) + 76 / 2;
  return clamp((columnCenter / gridWidth) * 100, 8, 91);
}

function getRoutine(scene: CitizenScene, name: string): string {
  switch (scene) {
    case 'night':
      return `Taking an evening stroll past ${name}'s building.`;
    case 'sunset':
      return `Heading past ${name}'s building before sunset.`;
    default:
      return `Making the daily rounds to ${name}'s building.`;
  }
}

function getConversation(
  citizen: Citizen,
  username: string,
  scene: CitizenScene,
  townEvent?: TownEvent,
): string[] {
  const { artist } = citizen;
  const plays = (artist.playcount ?? 0).toLocaleString();
  const rank = artist.rank === undefined ? 'one of the favorites' : `#${artist.rank}`;
  const stories = artist.stories;

  return [
    scene === 'night'
      ? `Evening, traveler! I'm ${citizen.nickname}. The lights around ${artist.name}'s building look lovely tonight.`
      : `Hi, traveler! I'm ${citizen.nickname}. I'm heading over to ${artist.name}'s place.`,
    `The city records say ${artist.name} has ${plays} scrobbles in ${username}'s selected listening era. That's a lot of music!`,
    `Their address is in the ${rank} spot in the city's artist rankings, and their building has ${stories} ${stories === 1 ? 'floor' : 'floors'}.`,
    PERSONALITIES[citizen.persona].line(artist.name),
    townEvent?.residentLine ?? `I'm keeping an eye on the Scrobble Square noticeboard for new events.`,
    `I like walking from the main crossroads to this block. Want to see ${artist.name}'s artist information?`,
  ];
}

function PixelResident() {
  return (
    <span className="citizen-sprite" aria-hidden="true">
      <span className="citizen-hair-back" />
      <span className="citizen-head"><span className="citizen-eyes" /></span>
      <span className="citizen-hat" />
      <span className="citizen-headphones" />
      <span className="citizen-body">
        <span className="citizen-scarf" />
        <span className="citizen-satchel" />
      </span>
      <span className="citizen-legs" />
    </span>
  );
}

export default function Citizens({
  city,
  onSelectBuilding,
  scene = 'day',
  townEvent,
  onTalkToCitizen,
}: CitizensProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const closeButton = useRef<HTMLButtonElement>(null);
  const lastCitizenButton = useRef<HTMLButtonElement | null>(null);

  const artists = city.buildings.filter((building) => building.type === 'artist');
  const citizens: Citizen[] = RESIDENT_INDEXES.flatMap((artistIndex, index) => {
    const artist = artists[artistIndex];
    if (!artist) return [];

    const seed = stableHash(
      `${city.username.toLowerCase()}|${artist.name.toLowerCase()}`
    );
    const stop = artistStopPercent(artist);
    const midpoint = (CROSSROADS_X + stop) / 2;
    const duration = (22 + seed % 12) * (scene === 'night' ? 1.4 : scene === 'sunset' ? 1.15 : 1);

    return [{
      id: `${artist.id}-${index}`,
      artist,
      nickname: residentName(artist, seed),
      persona: PERSONA_TYPES[(seed >>> 23) % PERSONA_TYPES.length],
      hairstyle: HAIR_STYLES[(seed >>> 2) % HAIR_STYLES.length],
      accessory: ACCESSORIES[(seed >>> 9) % ACCESSORIES.length],
      // Building y values are zero-based; CSS grid rows are one-based.
      // Artist lots occupy rows 4, 6 and 8, with streets just below.
      row: clamp(artist.y + 2, 5, 9),
      style: {
        '--citizen-skin': SKIN_COLORS[(seed >>> 1) % SKIN_COLORS.length],
        '--citizen-hair': HAIR_COLORS[(seed >>> 5) % HAIR_COLORS.length],
        '--citizen-shirt': SHIRT_COLORS[(seed >>> 11) % SHIRT_COLORS.length],
        '--citizen-pants': PANTS_COLORS[(seed >>> 17) % PANTS_COLORS.length],
        '--citizen-accent': SHIRT_COLORS[(seed >>> 20) % SHIRT_COLORS.length],
        '--walk-duration': `${duration.toFixed(1)}s`,
        '--walk-delay': `${-(index * 3 + seed % 6)}s`,
        '--walk-start': `${CROSSROADS_X}%`,
        '--walk-middle': `${midpoint.toFixed(1)}%`,
        '--walk-end': `${stop.toFixed(1)}%`,
      },
    }];
  });

  const selected = citizens.find((citizen) => citizen.id === selectedId);
  const selectedCitizenId = selected?.id;
  const lines = selected ? getConversation(selected, city.username, scene, townEvent) : [];

  useEffect(() => {
    if (!selectedCitizenId) return;
    closeButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedId(null);
        lastCitizenButton.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCitizenId]);

  function closeChat() {
    setSelectedId(null);
    lastCitizenButton.current?.focus();
  }

  function visitArtist(artist: CityBuilding) {
    setSelectedId(null);
    onSelectBuilding(artist);
  }

  return (
    <>
      {citizens.map((citizen) => (
        <div
          key={citizen.id}
          className="citizen-lane"
          style={{ gridColumn: '1 / -1', gridRow: citizen.row }}
        >
          <button
            type="button"
            className={
              `city-citizen citizen--${citizen.hairstyle} ` +
              `citizen-accessory--${citizen.accessory}`
            }
            style={citizen.style}
            onClick={(event) => {
              lastCitizenButton.current = event.currentTarget;
              setSelectedId(citizen.id);
              setLineIndex(0);
              onTalkToCitizen?.(citizen.artist.name);
            }}
            title={`Talk to ${citizen.nickname} about ${citizen.artist.name}`}
            aria-label={`Talk to ${citizen.nickname}, who likes ${citizen.artist.name}`}
          >
            <PixelResident />
            <span className="citizen-chat-indicator" aria-hidden="true">♪</span>
            <span className="citizen-tooltip">
              <strong>{citizen.nickname}</strong>
              <span>♪ {citizen.artist.name}</span>
            </span>
          </button>
        </div>
      ))}

      {selected && (
        <div className="citizen-chat-overlay">
          <button
            type="button"
            className="citizen-chat-backdrop"
            onClick={closeChat}
            aria-label="Close citizen conversation"
            tabIndex={-1}
          />
          <section
            className="citizen-chat-window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="citizen-chat-name"
            aria-describedby="citizen-chat-message"
          >
            <header className="citizen-chat-header">
              <span>✿ SCROBBLE CITY RESIDENT ✿</span>
              <button
                type="button"
                className="citizen-chat-close"
                onClick={closeChat}
                aria-label="Close conversation"
                ref={closeButton}
              >✕</button>
            </header>
            <div className="citizen-chat-person">
              <div
                className={
                  `citizen-chat-portrait citizen--${selected.hairstyle} ` +
                  `citizen-accessory--${selected.accessory}`
                }
                style={selected.style}
              >
                <PixelResident />
              </div>
              <div>
                <h3 id="citizen-chat-name">{selected.nickname}</h3>
                <p>♪ {selected.artist.name} enthusiast</p>
                <span className="citizen-persona-badge">{PERSONALITIES[selected.persona].name}</span>
                <small>{getRoutine(scene, selected.artist.name)}</small>
              </div>
            </div>
            <div className="citizen-chat-message" id="citizen-chat-message" aria-live="polite">
              <p>“{lines[lineIndex]}”</p>
              <span>{lineIndex + 1} / {lines.length}</span>
            </div>
            <div className="citizen-chat-actions">
              <button
                type="button"
                className="citizen-chat-next"
                onClick={() => setLineIndex((index) => (index + 1) % lines.length)}
              >{lineIndex === lines.length - 1 ? '↺ Talk again' : '💬 Keep talking →'}</button>
              <button
                type="button"
                className="citizen-chat-visit"
                onClick={() => visitArtist(selected.artist)}
              >♪ View artist building</button>
            </div>
            <p className="citizen-chat-disclaimer">
              Residents are fictional. Their dialogue uses the current city's Last.fm artist data.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
