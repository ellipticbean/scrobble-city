import type { CityBuilding, CityData } from '../types/city';

/**
 * Fictional local town happenings based on artist buildings already loaded.
 * No extra Last.fm calls, location services, or real event claims.
 */
export type TownEventKind = 'recordFair' | 'courtyardConcert' | 'listeningPicnic' | 'nightMarket';

export interface TownEvent {
  kind: TownEventKind;
  title: string;
  shortTitle: string;
  icon: string;
  summary: string;
  description: string;
  residentLine: string;
  guestArtist: CityBuilding | null;
}

const EVENT_KINDS: TownEventKind[] = [
  'recordFair', 'courtyardConcert', 'listeningPicnic', 'nightMarket',
];

function hashText(input: string): number {
  let hash = 2166136261;
  for (const character of input) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Preview 0 is today's featured poster; +1...+3 show other fictional events. */
export function getTownEvent(
  city: CityData,
  districtName: string,
  preview = 0,
  date = new Date(),
): TownEvent {
  const artists = city.buildings
    .filter((building) => building.type === 'artist')
    .sort((a, b) => (a.rank ?? 99999) - (b.rank ?? 99999));

  const daySeed = hashText(`${city.username.toLowerCase()}|${districtName}|${localDateKey(date)}`);
  const slot = ((daySeed % EVENT_KINDS.length) + preview) % EVENT_KINDS.length;
  const kind = EVENT_KINDS[(slot + EVENT_KINDS.length) % EVENT_KINDS.length];
  const artist = artists.length > 0 ? artists[(daySeed + preview) % artists.length] : null;
  const name = artist?.name ?? 'the neighborhood musicians';
  const playCount = artist?.playcount;
  const playNote = playCount == null
    ? 'One of the neighborhood favorites.'
    : `${Number(playCount).toLocaleString()} scrobbles in this selected city.`;

  switch (kind) {
    case 'recordFair':
      return {
        kind, title: 'Scrobble Square Record Fair', shortTitle: 'RECORD FAIR', icon: '💿',
        summary: `Rare finds and imaginary vinyl inspired by ${name}.`,
        description: `The residents have set up tiny record stalls near the fountain. Featured artist: ${name}. ${playNote} Browse the fictional crates and see which artists your city loves.`,
        residentLine: `I heard there's a record fair by the fountain. I'm hoping to find something by ${name}!`,
        guestArtist: artist,
      };
    case 'courtyardConcert':
      return {
        kind, title: 'Courtyard Mini Concert', shortTitle: 'MINI CONCERT', icon: '🎸',
        summary: `A pretend neighborhood concert in honor of ${name}.`,
        description: `The Scrobble Square stage is set for a make-believe tribute to ${name}. ${playNote} No real audio plays here yet—it's a little piece of city storytelling.`,
        residentLine: `There's a tiny courtyard concert celebrating ${name}! I'm saving a place near the front.`,
        guestArtist: artist,
      };
    case 'listeningPicnic':
      return {
        kind, title: 'Community Listening Picnic', shortTitle: 'PICNIC', icon: '🧺',
        summary: `A cozy listening picnic featuring ${name}.`,
        description: `Everyone has brought a blanket, a snack, and imaginary headphones. Today's picnic inspiration is ${name}. ${playNote} The picnic is a fictional activity inside your city.`,
        residentLine: `I'm on my way to the listening picnic! Somebody promised to bring a playlist with ${name}.`,
        guestArtist: artist,
      };
    case 'nightMarket':
      return {
        kind, title: 'Moonlight Music Market', shortTitle: 'NIGHT MARKET', icon: '🌙',
        summary: `Pastel lanterns, mixtapes and music inspired by ${name}.`,
        description: `The plaza's little stalls are decorated for the imaginary Moonlight Music Market. Today's featured artist is ${name}. ${playNote} Try switching your city atmosphere to Night for the full mood.`,
        residentLine: `The Moonlight Music Market is lovely! Someone is trading mixtapes inspired by ${name}.`,
        guestArtist: artist,
      };
  }
}
