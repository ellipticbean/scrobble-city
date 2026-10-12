/** Fictional collectable record sleeves, saved in the visitor's browser.
 * No personal credentials, purchases or external requests are used. */
export interface CollectedRecord {
  id: string;
  artist: string;
  district: string;
  era: string;
  rank: number;
  scrobbles: number;
  collectedAt: string;
  favorite: boolean;
}

export type RecordInput = Pick<CollectedRecord, 'artist' | 'district' | 'era' | 'rank' | 'scrobbles'>;
export const collectionStorageKey = (ownerKey: string) => `${ownerKey}:vinyl-collection-v1`;

export function recordId(artist: string): string {
  return artist.normalize('NFKC').trim().toLocaleLowerCase('en-US');
}

export function cleanRecords(value: unknown): CollectedRecord[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, CollectedRecord>();
  for (const entry of value.slice(0, 1000)) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.artist !== 'string' || item.artist.trim().length === 0 || item.artist.length > 220 ||
        typeof item.district !== 'string' || item.district.length > 90 ||
        typeof item.era !== 'string' || item.era.length > 120 ||
        typeof item.collectedAt !== 'string' || !Number.isFinite(Date.parse(item.collectedAt))) continue;
    const id = recordId(item.artist);
    if (unique.has(id)) continue;
    unique.set(id, {
      id, artist: item.artist, district: item.district, era: item.era,
      rank: typeof item.rank === 'number' && Number.isFinite(item.rank) ? item.rank : 0,
      scrobbles: typeof item.scrobbles === 'number' && Number.isFinite(item.scrobbles) ? item.scrobbles : 0,
      collectedAt: item.collectedAt, favorite: item.favorite === true,
    });
  }
  return [...unique.values()];
}

export function loadRecords(ownerKey: string): CollectedRecord[] {
  try {
    return cleanRecords(JSON.parse(window.localStorage.getItem(collectionStorageKey(ownerKey)) ?? '[]'));
  } catch { return []; }
}

function store(ownerKey: string, records: CollectedRecord[]): void {
  try { window.localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(records)); }
  catch { /* No storage permission: remains usable within the dialog. */ }
}

export function collectRecord(ownerKey: string, current: CollectedRecord[], input: RecordInput): { records: CollectedRecord[]; added: boolean } {
  const existing = new Map<string, CollectedRecord>();
  for (const item of [...loadRecords(ownerKey), ...current]) existing.set(item.id, item);
  const id = recordId(input.artist);
  if (!id || existing.has(id)) return { records: [...existing.values()], added: false };
  const record: CollectedRecord = {
    id, artist: input.artist, district: input.district, era: input.era,
    rank: input.rank, scrobbles: input.scrobbles,
    collectedAt: new Date().toISOString(), favorite: false,
  };
  existing.set(id, record);
  const records = [...existing.values()];
  store(ownerKey, records);
  return { records, added: true };
}

export function toggleRecordFavorite(ownerKey: string, current: CollectedRecord[], id: string): CollectedRecord[] {
  const records = current.map((record) => record.id === id ? { ...record, favorite: !record.favorite } : record);
  store(ownerKey, records);
  return records;
}
