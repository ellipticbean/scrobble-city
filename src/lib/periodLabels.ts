import type { LastFmPeriod } from '../types/lastfm';

/** Display labels shared between the city header and Time Machine. */
export const periodLabels: Record<LastFmPeriod, string> = {
  overall: 'All Time',
  '12month': 'Last 12 Months',
  '6month': 'Last 6 Months',
  '3month': 'Last 3 Months',
  '1month': 'Last Month',
  '7day': 'Last 7 Days',
};
