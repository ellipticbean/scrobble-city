/* Scrobble City — Step 19.6C: advanced musical achievements.
   Kept in a separate localStorage record from neighborhood stamps.
   Existing earned badges and resident conversations remain intact. */

export const ACHIEVEMENTS = [
  { id: 'city-hall', icon: '🏛️', name: 'Under Investigation', description: 'Enter the Department of Musical Affairs.' },
  { id: 'time-traveler', icon: '🕰️', name: 'Time Traveler', description: 'Successfully travel to another Quick Travel era.' },
  { id: 'archive-explorer', icon: '📜', name: 'Archive Explorer', description: 'Reconstruct a historical year, month, or custom date range.' },
  { id: 'matchmaking-visitor', icon: '💌', name: 'Cupid’s Apprentice', description: 'Visit the Music Taste Matchmaking Agency.' },
  { id: 'census-visitor', icon: '📋', name: 'Officially Counted', description: 'Visit the Census Office.' },
  { id: 'community-spirit', icon: '🎸', name: 'Community Spirit', description: 'Read an announcement on the Scrobble Square noticeboard.' },
  { id: 'social-butterfly', icon: '💬', name: 'Social Butterfly', description: 'Talk to five different artist-loving residents.' },
  { id: 'night-owl', icon: '🌙', name: 'Night Owl', description: 'Explore Scrobble City while the Night atmosphere is active.' },
  { id: 'master-explorer', icon: '🏆', name: 'Master Explorer', description: 'Collect all currently available neighborhood stamps.' },
  { id: 'musical-soulmates', icon: '💘', name: 'Musical Soulmates', description: 'Successfully compare your listening history with another Last.fm account.' },
  { id: 'history-detective', icon: '📊', name: 'History Detective', description: 'Successfully compare two different calendar years in the Census Office.' },
  { id: 'perfect-harmony', icon: '💞', name: 'Perfect Harmony', description: 'Find another listener with at least 50% musical similarity.' },
  { id: 'through-decades', icon: '🗓️', name: 'Through the Decades', description: 'Study listening history from three different calendar years using the Time Machine or Census Office.' },
  { id: 'record-collector', icon: '💿', name: 'Record Collector', description: 'Collect your first fictional vinyl record from The Needle & Nook.' },
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];
export type AchievementActivity = AchievementId | 'talk' | 'compare-listeners' | 'compare-years' | 'study-year';
export interface EarnedAchievement { id: AchievementId; earnedAt: string }
export interface AchievementProgress {
  earned: EarnedAchievement[];
  residentIds: string[];
  calendarYears: number[];
}

export interface AchievementDetails {
  score?: number;
  years?: number[];
}

export const EMPTY_ACHIEVEMENTS: AchievementProgress = {
  earned: [], residentIds: [], calendarYears: [],
};

const validIds: ReadonlySet<string> = new Set(ACHIEVEMENTS.map(item => item.id));

function validDate(iso: unknown): iso is string {
  return typeof iso === 'string' && Number.isFinite(Date.parse(iso));
}

function validYear(year: unknown): year is number {
  return typeof year === 'number' && Number.isInteger(year) &&
    year >= 2002 && year <= new Date().getUTCFullYear();
}

function clean(value: unknown): AchievementProgress {
  if (!value || typeof value !== 'object') return { earned: [], residentIds: [], calendarYears: [] };
  const source = value as Record<string, unknown>;
  const earned = new Map<AchievementId, EarnedAchievement>();
  if (Array.isArray(source.earned)) {
    for (const raw of source.earned) {
      if (!raw || typeof raw !== 'object') continue;
      const e = raw as Record<string, unknown>;
      if (typeof e.id === 'string' && validIds.has(e.id) && validDate(e.earnedAt)) {
        const id = e.id as AchievementId;
        if (!earned.has(id)) earned.set(id, { id, earnedAt: e.earnedAt });
      }
    }
  }
  const residentIds = Array.isArray(source.residentIds)
    ? [...new Set(source.residentIds.filter((id): id is string =>
      typeof id === 'string' && id.length > 0 && id.length <= 220))].slice(0, 1000)
    : [];
  // Older 19.6B progress did not have calendarYears; treat it as an empty list.
  const calendarYears = Array.isArray(source.calendarYears)
    ? [...new Set(source.calendarYears.filter(validYear))].sort((a, b) => a - b)
    : [];
  return { earned: [...earned.values()], residentIds, calendarYears };
}

// Preserve the exact storage key used in Step 19.6B.
export function achievementStorageKey(ownerKey: string): string {
  return `${ownerKey}:achievements-v1`;
}

export function loadAchievements(ownerKey: string): AchievementProgress {
  try {
    const raw = window.localStorage.getItem(achievementStorageKey(ownerKey));
    return raw ? clean(JSON.parse(raw) as unknown) : clean(null);
  } catch {
    return clean(null);
  }
}

export interface AchievementUpdate {
  progress: AchievementProgress;
  newlyEarned: AchievementId[];
  changed: boolean;
}

export function updateAchievements(
  ownerKey: string,
  existing: AchievementProgress | null,
  activity: AchievementActivity,
  residentId?: string,
  details?: AchievementDetails,
): AchievementUpdate {
  // Merge saved + in-memory progress so multiple actions in a single render
  // keep their data, and old saved badges survive this update.
  const stored = loadAchievements(ownerKey);
  const memory = clean(existing);
  const earned = new Map<AchievementId, EarnedAchievement>();
  for (const item of [...stored.earned, ...memory.earned]) {
    if (!earned.has(item.id)) earned.set(item.id, item);
  }
  const residents = new Set([...stored.residentIds, ...memory.residentIds]);
  const years = new Set([...stored.calendarYears, ...memory.calendarYears]);
  const beforeEarned = earned.size;
  const beforeResidents = residents.size;
  const beforeYears = years.size;
  const newlyEarned: AchievementId[] = [];

  function award(id: AchievementId) {
    if (earned.has(id)) return;
    earned.set(id, { id, earnedAt: new Date().toISOString() });
    newlyEarned.push(id);
  }

  if (activity === 'talk') {
    const normalized = residentId?.trim().toLocaleLowerCase('en-US');
    if (normalized && normalized.length <= 220) residents.add(normalized);
    if (residents.size >= 5) award('social-butterfly');
  } else if (activity === 'compare-listeners') {
    // Only successful, valid cross-user comparisons call this action.
    const score = details?.score;
    if (typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100) {
      award('musical-soulmates');
      if (score >= 50) award('perfect-harmony');
    }
  } else if (activity === 'compare-years') {
    // Requires a real, successful comparison of TWO distinct year charts.
    const requested = details?.years ?? [];
    if (requested.length === 2 && requested.every(validYear) && requested[0] !== requested[1]) {
      award('history-detective');
      requested.forEach((year) => years.add(year));
    }
  } else if (activity === 'study-year') {
    // Only the full-calendar-year historical travel mode counts here.
    const requested = details?.years ?? [];
    if (requested.length === 1 && validYear(requested[0])) years.add(requested[0]);
  } else {
    award(activity);
  }

  if (years.size >= 3) award('through-decades');

  const changed = beforeEarned !== earned.size || beforeResidents !== residents.size || beforeYears !== years.size;
  const progress: AchievementProgress = {
    earned: [...earned.values()],
    residentIds: [...residents],
    calendarYears: [...years].sort((a, b) => a - b),
  };
  if (changed) {
    try {
      window.localStorage.setItem(achievementStorageKey(ownerKey), JSON.stringify(progress));
    } catch { /* Storage disabled — React state still works. */ }
  }
  return { progress, newlyEarned, changed };
}
