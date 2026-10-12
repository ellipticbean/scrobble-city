/* =========================================================
   SCROBBLE CITY — VISITOR PASSPORT (STEP 19.6A)
   Progress stays in this browser, separately for each city.
   No Last.fm credentials or API calls are needed.
   ========================================================= */

export type PassportSource = 'lastfm' | 'demo';

export interface PassportStamp {
  districtId: string;
  stampedAt: string;
}

export function passportOwnerKey(
  source: PassportSource,
  username: string
): string {
  return `scrobble-city-passport-v1:${source}:${encodeURIComponent(
    username.trim().toLocaleLowerCase('en-US')
  )}`;
}

function validStamp(value: unknown): value is PassportStamp {
  if (!value || typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.districtId === 'string' &&
    /^district-[1-9]\d*$/.test(record.districtId) &&
    typeof record.stampedAt === 'string' &&
    Number.isFinite(Date.parse(record.stampedAt))
  );
}

export function loadPassport(ownerKey: string): PassportStamp[] {
  try {
    const text = window.localStorage.getItem(ownerKey);
    if (!text) return [];

    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];

    const unique = new Map<string, PassportStamp>();
    for (const item of parsed) {
      if (validStamp(item) && !unique.has(item.districtId)) {
        unique.set(item.districtId, item);
      }
    }
    return [...unique.values()];
  } catch {
    // Private browsing, blocked storage, or damaged stored data.
    return [];
  }
}

export function stampPassport(
  ownerKey: string,
  districtId: string,
  inMemoryStamps: PassportStamp[] = []
): PassportStamp[] {
  const unique = new Map<string, PassportStamp>();

  // Merge browser storage with current React state. This also lets the
  // passport keep working for this session when storage is unavailable.
  for (const item of [...loadPassport(ownerKey), ...inMemoryStamps]) {
    if (validStamp(item) && !unique.has(item.districtId)) {
      unique.set(item.districtId, item);
    }
  }

  if (/^district-[1-9]\d*$/.test(districtId) && !unique.has(districtId)) {
    unique.set(districtId, {
      districtId,
      stampedAt: new Date().toISOString(),
    });
  }

  const stamps = [...unique.values()];
  try {
    window.localStorage.setItem(ownerKey, JSON.stringify(stamps));
  } catch {
    // Saved locally when permitted; still usable in memory otherwise.
  }
  return stamps;
}
