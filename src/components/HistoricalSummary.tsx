
/* =========================================
   SCROBBLE CITY - HISTORICAL ARCHIVE
========================================= */

export interface HistoricalSummaryData {
  totalScrobbles: number;
  totalArtists: number;
  topArtist: string;
  pagesFetched: number;
}

interface HistoricalSummaryProps {
  era: string;
  summary: HistoricalSummaryData;
}

export default function HistoricalSummary({
  era,
  summary,
}: HistoricalSummaryProps) {
  return (
    <section
      className="historical-summary"
      aria-label="Historical listening summary"
    >
      <div className="historical-summary-heading">
        <div>
          <span>📜 SCROBBLE CITY HISTORICAL ARCHIVES</span>
          <h3>Greetings from {era}!</h3>
          <p>
            An official record of your musical adventures
            during this period.
          </p>
        </div>

        <div className="historical-summary-stamp">
          ARCHIVED
        </div>
      </div>

      <div className="historical-summary-stats">
        <div>
          <span>♫ TOTAL SCROBBLES</span>
          <strong>
            {summary.totalScrobbles.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>🏘️ UNIQUE ARTISTS</span>
          <strong>
            {summary.totalArtists.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>🏆 TOP ARTIST</span>
          <strong>{summary.topArtist}</strong>
        </div>

        <div>
          <span>📂 ARCHIVE PAGES</span>
          <strong>
            {summary.pagesFetched.toLocaleString()}
          </strong>
        </div>
      </div>

      <p className="historical-summary-footer">
        These statistics describe the selected historical
        period. Your city currently displays its top
        15 artists.
      </p>
    </section>
  );
}
