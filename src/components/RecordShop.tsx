import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import type { CityBuilding, CityData } from '../types/city';
import { loadRecords, collectRecord, toggleRecordFavorite, recordId, type CollectedRecord } from '../lib/recordCollection';

type ShopSpot = 'counter' | 'arrivals' | 'rare' | 'crate' | 'listening';

interface RecordShopProps {
  city: CityData;
  districtName: string;
  ownerKey: string;
  eraLabel: string;
  onCollectRecord: () => void;
  onClose: () => void;
}

const ROOM_AREAS: { id: ShopSpot; label: string; hint: string }[] = [
  { id: 'arrivals', label: 'New arrivals', hint: 'Freshly filed favorites' },
  { id: 'rare', label: 'Hidden gems', hint: 'The deeper shelves' },
  { id: 'listening', label: 'Listening nook', hint: 'A quiet corner' },
  { id: 'counter', label: 'Meet Marigold', hint: 'Your friendly shopkeeper' },
  { id: 'crate', label: 'Bargain crate', hint: 'Records worth digging for' },
];

const MARIGOLD_LINES = [
  'Welcome! I keep a little imaginary record for every artist in the neighborhood.',
  'Around here, your listening history decides what goes on the shelves. Every visit might look different!',
  'See the cozy listening nook? You can inspect a favorite there. We do not play audio yet, but we can talk records all day.',
  'You can collect a free imaginary pressing from the shelves! Try visiting other neighborhoods for new treasures.',
];

function accentFor(name: string): string {
  const colors = ['#a88ac4', '#8db9a1', '#e9a4ad', '#deb577', '#83b7ce', '#bc9eb6'];
  let value = 0;
  for (const character of name) value = (value * 33 + character.charCodeAt(0)) >>> 0;
  return colors[value % colors.length];
}

function rankText(artist: CityBuilding): string {
  return `#${artist.rank ?? '?'} · ${(artist.playcount ?? 0).toLocaleString()} scrobbles`;
}

export default function RecordShop({ city, districtName, ownerKey, eraLabel, onCollectRecord, onClose }: RecordShopProps) {
  const [spot, setSpot] = useState<ShopSpot>('counter');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chatLine, setChatLine] = useState(0);
  const [collection, setCollection] = useState<CollectedRecord[]>(() => loadRecords(ownerKey));
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [collectionQuery, setCollectionQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const artists = useMemo(
    () => city.buildings
      .filter((building) => building.type === 'artist')
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)),
    [city.buildings],
  );

  const featured = artists[0];
  const displayed = spot === 'arrivals'
    ? artists.slice(0, 5)
    : spot === 'rare'
      ? artists.slice(5, 10)
      : spot === 'crate'
        ? artists.slice(10, 15)
        : spot === 'listening'
          ? artists.slice(0, 4)
          : [];
  const displayedRecords = displayed.length > 0 ? displayed : artists.slice(0, 5);
  const selectedArtist = artists.find((artist) => artist.id === selectedId);
  const activeArea = ROOM_AREAS.find((area) => area.id === spot);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleDialogKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)'
      ) ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleDialogKeyboard);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleDialogKeyboard);
      document.body.style.overflow = oldOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  function collectArtist(artist: CityBuilding) {
    const result = collectRecord(ownerKey, collection, {
      artist: artist.name, district: districtName, era: eraLabel,
      rank: artist.rank ?? 0, scrobbles: artist.playcount ?? 0,
    });
    setCollection(result.records);
    if (result.added && collection.length === 0) onCollectRecord();
  }

  const visibleCollection = collection.filter((record) =>
    record.artist.toLocaleLowerCase().includes(collectionQuery.trim().toLocaleLowerCase()) &&
    (!favoritesOnly || record.favorite));

  function chooseSpot(next: ShopSpot) {
    setSpot(next);
    setSelectedId(null);
  }

  return (
    <div className="record-shop-overlay">
      <section
        className="record-shop-window"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-shop-title"
        aria-describedby="record-shop-description"
      >
        <header className="record-shop-header">
          <div>
            <span className="record-shop-eyebrow">✿ SCROBBLE CITY • SOUTH MARKET ✿</span>
            <h2 id="record-shop-title">💿 The Needle &amp; Nook</h2>
            <p id="record-shop-description">A tiny record store made from your listening history.</p>
          </div>
          <button
            type="button"
            className="record-shop-close"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Leave the Record Shop"
          >✕</button>
        </header>

        <div className="record-shop-content">
          <div className="record-shop-collection-toolbar">
            <strong>💿 {collection.length} records collected</strong>
            <button type="button" onClick={() => setCollectionOpen((value) => !value)}
              aria-expanded={collectionOpen} aria-controls="record-shop-collection">
              {collectionOpen ? '↩ Back to browsing' : '📚 My collection'}
            </button>
          </div>
          {collectionOpen && <section id="record-shop-collection" className="record-shop-collection">
            <h3>My Record Collection</h3>
            <p>Fictional souvenirs from your musical city. Collect each artist once, across different neighborhoods and listening eras.</p>
            <div className="record-shop-collection-filters">
              <label><span className="sr-only">Search collected artists</span>
                <input type="search" value={collectionQuery} onChange={(event) => setCollectionQuery(event.target.value)} placeholder="Find a record…" /></label>
              <label><input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} /> Favorites only</label>
            </div>
            {visibleCollection.length ? <div className="record-shop-collection-grid">
              {visibleCollection.map((record) => <article key={record.id} className="record-shop-collection-item">
                <span className="record-shop-record-cover" style={{ '--sleeve-accent': accentFor(record.artist) } as CSSProperties} aria-hidden="true"><span className="record-shop-record-disc" /></span>
                <strong>{record.artist}</strong>
                <small>Found in {record.district} · {record.era}</small>
                <small>First collected {new Date(record.collectedAt).toLocaleDateString()}</small>
                <button type="button" aria-pressed={record.favorite}
                  onClick={() => setCollection(toggleRecordFavorite(ownerKey, collection, record.id))}>
                  {record.favorite ? '♥ Favorite' : '♡ Add favorite'}
                </button>
              </article>)}
            </div> : <p className="record-shop-collection-empty">{collection.length ? 'No records match your filters.' : 'Your shelf is empty. Inspect an artist record below and choose Collect.'}</p>}
          </section>}
          <div className="record-shop-welcome">
            <span>♪ NOW OPEN ♪</span>
            <strong>{districtName} branch</strong>
            <small>Welcome, {city.username}! All records on display are playful, imaginary pressings inspired by the artists in this neighborhood.</small>
          </div>

          <div className="record-shop-interior" aria-label="Interactive pixel-art record shop interior">
            <div className="record-shop-wall-border" aria-hidden="true" />
            <button
              type="button"
              className={`record-shop-scene-spot record-shop-scene-shelf record-shop-scene-arrivals ${spot === 'arrivals' ? 'is-active' : ''}`}
              onClick={() => chooseSpot('arrivals')}
              aria-pressed={spot === 'arrivals'}
            >
              <span className="record-shop-spine-row" aria-hidden="true" />
              <span className="record-shop-scene-label">NEW ARRIVALS</span>
            </button>
            <button
              type="button"
              className={`record-shop-scene-spot record-shop-scene-shelf record-shop-scene-rare ${spot === 'rare' ? 'is-active' : ''}`}
              onClick={() => chooseSpot('rare')}
              aria-pressed={spot === 'rare'}
            >
              <span className="record-shop-spine-row record-shop-spine-row--alt" aria-hidden="true" />
              <span className="record-shop-scene-label">HIDDEN GEMS</span>
            </button>
            <button
              type="button"
              className={`record-shop-scene-spot record-shop-scene-listening ${spot === 'listening' ? 'is-active' : ''}`}
              onClick={() => chooseSpot('listening')}
              aria-pressed={spot === 'listening'}
            >
              <span className="record-shop-pixel-player" aria-hidden="true"><span /></span>
              <span className="record-shop-scene-label">LISTENING NOOK</span>
            </button>
            <button
              type="button"
              className={`record-shop-scene-spot record-shop-scene-counter ${spot === 'counter' ? 'is-active' : ''}`}
              onClick={() => chooseSpot('counter')}
              aria-pressed={spot === 'counter'}
            >
              <span className="record-shop-person" aria-hidden="true"><span className="record-shop-person-hair" /><span className="record-shop-person-face" /><span className="record-shop-person-shirt" /></span>
              <span className="record-shop-counter-top" aria-hidden="true" />
              <span className="record-shop-scene-label">MARIGOLD'S COUNTER</span>
            </button>
            <button
              type="button"
              className={`record-shop-scene-spot record-shop-scene-crate ${spot === 'crate' ? 'is-active' : ''}`}
              onClick={() => chooseSpot('crate')}
              aria-pressed={spot === 'crate'}
            >
              <span className="record-shop-crate-vinyl" aria-hidden="true" />
              <span className="record-shop-scene-label">BARGAIN CRATE</span>
            </button>
            <span className="record-shop-floor-plant record-shop-floor-plant--left" aria-hidden="true">✿</span>
            <span className="record-shop-floor-plant record-shop-floor-plant--right" aria-hidden="true">✿</span>
            <button type="button" className="record-shop-exit" onClick={onClose}>↙ EXIT TO CITY</button>
          </div>

          <div className="record-shop-details" aria-live="polite">
            <div className="record-shop-details-heading">
              <div>
                <small>♪ CURRENTLY EXPLORING</small>
                <h3>{activeArea?.label ?? 'The shop'}</h3>
                <p>{activeArea?.hint}</p>
              </div>
              <span className="record-shop-details-icon" aria-hidden="true">{spot === 'counter' ? '🌻' : spot === 'listening' ? '🎧' : '💿'}</span>
            </div>

            {spot === 'counter' ? (
              <div className="record-shop-chat">
                <div className="record-shop-shopkeeper-name">🌻 Marigold · Shopkeeper</div>
                <p>“{MARIGOLD_LINES[chatLine]}{chatLine === 0 && featured ? ` I see ${featured.name} is a big favorite around here!` : ''}”</p>
                <div className="record-shop-chat-actions">
                  <button type="button" onClick={() => setChatLine((current) => (current + 1) % MARIGOLD_LINES.length)}>
                    {chatLine === MARIGOLD_LINES.length - 1 ? '↺ Chat again' : '💬 Keep talking →'}
                  </button>
                  <small>{chatLine + 1} / {MARIGOLD_LINES.length}</small>
                </div>
              </div>
            ) : (
              <>
                <p className="record-shop-detail-note">
                  {spot === 'listening'
                    ? 'Pick a display record to inspect the artist. The listening station does not play audio yet.'
                    : 'Browse these fictional record sleeves. Choose any sleeve to collect a free fictional vinyl souvenir.'}
                </p>
                <div className="record-shop-record-list">
                  {displayedRecords.map((artist) => (
                    <button
                      type="button"
                      key={artist.id}
                      className={`record-shop-record ${selectedId === artist.id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedId(artist.id)}
                      aria-pressed={selectedId === artist.id}
                    >
                      <span
                        className="record-shop-record-cover"
                        style={{ '--sleeve-accent': accentFor(artist.name) } as CSSProperties}
                        aria-hidden="true"
                      ><span className="record-shop-record-disc" /></span>
                      <strong>{artist.name}</strong>
                      <small>Rank #{artist.rank ?? '?'}</small>
                    </button>
                  ))}
                </div>
                {selectedArtist && (
                  <div className="record-shop-artist-detail">
                    <span>✧ DISPLAY RECORD INSPECTED</span>
                    <strong>{selectedArtist.name}</strong>
                    <small>{rankText(selectedArtist)}</small>
                    <p>Made-up sleeve, real listening data. This artist has a place in your current Scrobble City.</p>
                    <button type="button" className="record-shop-collect-button"
                      disabled={collection.some((item) => item.id === recordId(selectedArtist.name))}
                      onClick={() => collectArtist(selectedArtist)}>
                      {collection.some((item) => item.id === recordId(selectedArtist.name))
                        ? '✓ Already in your collection' : '💿 Collect this record (free)'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <p className="record-shop-disclaimer">These collectible sleeves are fictional, inspired by real artist names and scrobble data. No purchases, audio streaming or extra Last.fm requests occur here. Records are stored locally in this browser.</p>
        </div>
        <footer className="record-shop-footer">THE NEEDLE &amp; NOOK • INDEPENDENT RECORDS • SCROBBLE CITY</footer>
      </section>
    </div>
  );
}
