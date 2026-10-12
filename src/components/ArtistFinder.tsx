import { useState } from 'react';
import type { ArtistDistrict } from '../lib/cityDistricts';

interface Props {
  districts: ArtistDistrict[];
  onLocate: (districtIndex: number, name: string, rank: number) => void;
  disabled?: boolean;
}

export default function ArtistFinder({ districts, onLocate, disabled }: Props) {
  const [query, setQuery] = useState('');
  const matches = districts.flatMap((district, districtIndex) =>
    district.artists.map((artist, index) => ({
      artist, district, districtIndex, rank: Number(artist['@attr']?.rank) || district.firstRank + index,
    })))
    .filter(({ artist }) => artist.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .slice(0, 12);
  return (
    <section className="artist-finder" aria-label="Artist directory">
      <div>
        <strong>🔎 Find an artist in your city</strong>
        <small>Search the top {districts.reduce((sum, d) => sum + d.artists.length, 0)} artists from this era.</small>
      </div>
      <label className="artist-finder-search">
        <span className="sr-only">Artist name</span>
        <input type="search" value={query} placeholder="Search artist names…" maxLength={150}
          onChange={(event) => setQuery(event.target.value)} />
      </label>
      {query.trim() && (
        <div className="artist-finder-results" aria-live="polite">
          {matches.length ? matches.map(({ artist, district, districtIndex, rank }) => (
            <button type="button" key={`${district.id}-${rank}-${artist.name}`} disabled={disabled}
              onClick={() => { onLocate(districtIndex, artist.name, rank); setQuery(''); }}>
              <strong>{artist.name}</strong>
              <small>#{rank} · {district.name} ↗</small>
            </button>
          )) : <p>No matching artists in the current city's top chart.</p>}
        </div>
      )}
    </section>
  );
}
