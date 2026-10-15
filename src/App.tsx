import { useEffect, useState } from 'react';
import { ACHIEVEMENTS, loadAchievements, updateAchievements, type AchievementId, type AchievementProgress, type AchievementActivity, type AchievementDetails } from './lib/achievements';
import VisitorPassport from './components/VisitorPassport';
import { passportOwnerKey, stampPassport, type PassportStamp, type PassportSource } from './lib/passport';

import UsernameForm from './components/UsernameForm';
import CityMap from './components/CityMap';
import RecordShop from './components/RecordShop';
import ArtistFinder from './components/ArtistFinder';
import ProgressBackup from './components/ProgressBackup';
import PrivacyNotice from './components/PrivacyNotice';
import { lastFmUserUrl } from './lib/lastfmLinks';
import InfoPanel from './components/InfoPanel';
import MusicalAffairs from './components/MusicalAffairs';
import MusicTimeMachine from './components/MusicTimeMachine';
import { periodLabels } from './lib/periodLabels';
import HistoricalSummary, {
  type HistoricalSummaryData,
} from './components/HistoricalSummary';

import { getTopArtists } from './lib/lastfm';
import { generateCity } from './lib/cityGenerator';
import { createArtistDistricts, type ArtistDistrict } from './lib/cityDistricts';
import { mockArtists } from './lib/mockData';
import HistoricalTimeline from './components/HistoricalTimeline';
import CensusOffice from './components/CensusOffice';
import DistrictNavigator from './components/DistrictNavigator';

import MusicDatingProfile from './components/MusicDatingProfile';


import type {
  HistoricalProgress,
} from './lib/historicalStats';

import {
  getCachedHistoricalArtistChart,
} from './lib/historicalCache';


import type { CityBuilding, CityData } from './types/city';
import type { LastFmArtist, LastFmPeriod } from './types/lastfm';

/* =========================================
   SCROBBLE CITY - MAIN APPLICATION
========================================= */

export default function App() {
  /* =====================================
     CITY STATE
  ===================================== */

  const [city, setCity] = useState<CityData | null>(null);
  // The original top-15 Town Center remains the source for
  // city-wide attractions, even when exploring outer districts.
  const [townCenterCity, setTownCenterCity] = useState<CityData | null>(null);
  const [selectedBuilding, setSelectedBuilding] =
    useState<CityBuilding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataSource, setDataSource] =
    useState<'lastfm' | 'demo' | null>(null);
  const [censusOpen, setCensusOpen] = useState(false);
  const [recordShopOpen, setRecordShopOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // The whole city is kept as ranked districts, while only one
  // district of up to 15 artist buildings is rendered at a time.
  const [districts, setDistricts] = useState<ArtistDistrict[]>([]);
  const [activeDistrictIndex, setActiveDistrictIndex] = useState(0);

  // Explorer passport: one stamp per visited neighborhood, per account.
  const [passportOpen, setPassportOpen] = useState(false);
  const [passportState, setPassportState] = useState<{
    ownerKey: string;
    stamps: PassportStamp[];
  } | null>(null);

  function recordDistrictVisit(
    username: string,
    source: PassportSource,
    districtId: string,
    currentDistrictIds: string[] = [],
  ) {
    const ownerKey = passportOwnerKey(source, username);
    const remembered = passportState?.ownerKey === ownerKey
      ? passportState.stamps
      : [];

    const nextStamps = stampPassport(ownerKey, districtId, remembered);
    setPassportState({ ownerKey, stamps: nextStamps });
    // Existing collected stamps count; no need to revisit after an upgrade.
    const availableDistrictIds = currentDistrictIds.length
      ? currentDistrictIds : districts.map((item) => item.id);
    if (availableDistrictIds.length > 0 &&
      availableDistrictIds.every((id) => nextStamps.some((stamp) => stamp.districtId === id))) {
      recordForOwner(username, source, 'master-explorer');
    }
  }

  // Achievement collection is separate from the older neighborhood stamps.
  const [achievementState, setAchievementState] = useState<{
    ownerKey: string;
    progress: AchievementProgress;
  } | null>(null);
  // Queue unlock notices: a 50%+ comparison earns two badges at once.
  const [achievementToasts, setAchievementToasts] = useState<AchievementId[]>([]);
  const achievementToast = achievementToasts[0] ?? null;

  useEffect(() => {
    if (!achievementToast) return;
    const timeout = window.setTimeout(() => {
      setAchievementToasts((notices) => notices.slice(1));
    }, 5200);
    return () => window.clearTimeout(timeout);
  }, [achievementToast]);

  function recordForOwner(
    username: string,
    source: PassportSource,
    activity: AchievementActivity,
    residentId?: string,
    details?: AchievementDetails,
  ) {
    const ownerKey = passportOwnerKey(source, username);
    const remembered = achievementState?.ownerKey === ownerKey
      ? achievementState.progress : null;
    const updated = updateAchievements(ownerKey, remembered, activity, residentId, details);
    if (updated.changed) {
      setAchievementState({ ownerKey, progress: updated.progress });
    }
    if (updated.newlyEarned.length) {
      setAchievementToasts((notices) => [...notices, ...updated.newlyEarned]);
    }
  }

  function recordActivity(
    activity: AchievementActivity,
    residentId?: string,
    details?: AchievementDetails,
  ) {
    if (city && dataSource) recordForOwner(city.username, dataSource, activity, residentId, details);
  }

  // Music Taste Dating Profile
  const [datingOpen, setDatingOpen] = useState(false);

  /* =====================================
     LANDMARK AND TIME MACHINE STATE
  ===================================== */

  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [timeMachineOpen, setTimeMachineOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] =
    useState<LastFmPeriod>('overall');
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelError, setTravelError] = useState('');

  /* =====================================
     HISTORICAL TRAVEL STATE
  ===================================== */

  const [historicalEraLabel, setHistoricalEraLabel] =
    useState<string | null>(null);
  const [historicalProgress, setHistoricalProgress] =
    useState<HistoricalProgress | null>(null);
  const [historicalSummary, setHistoricalSummary] =
    useState<HistoricalSummaryData | null>(null);
  const [historicalTimelineYear, setHistoricalTimelineYear] =
    useState<number | null>(null);
  /* =====================================
     NEIGHBORHOOD TRAVEL
  ===================================== */

  function showFirstDistrict(
    username: string,
    artists: LastFmArtist[],
    source: PassportSource
  ) {
    const nextDistricts = createArtistDistricts(artists);

    if (nextDistricts.length === 0) {
      throw new Error('No artists were available to build this city.');
    }

    const ownerKey = passportOwnerKey(source, username);
    setAchievementState({ ownerKey, progress: loadAchievements(ownerKey) });
    setDistricts(nextDistricts);
    setActiveDistrictIndex(0);
    recordDistrictVisit(username, source, nextDistricts[0].id, nextDistricts.map((item) => item.id));
    setPassportOpen(false);
    setRecordShopOpen(false);
    setBackupOpen(false);
    const cityWideArtists = nextDistricts.flatMap((district) => district.artists);
    const townCenter = generateCity(
      username,
      nextDistricts[0].artists,
      cityWideArtists
    );
    setTownCenterCity(townCenter);
    setCity(townCenter);
    setSelectedBuilding(null);
  }

  function handleSelectDistrict(index: number) {
    if (!city || loading || travelLoading || index === activeDistrictIndex) {
      return;
    }

    const nextDistrict = districts[index];
    if (!nextDistrict) return;

    setActiveDistrictIndex(index);
    if (dataSource) {
      recordDistrictVisit(city.username, dataSource, nextDistrict.id);
    }
    const cityWideArtists = districts.flatMap((district) => district.artists);
    setCity(generateCity(
      city.username,
      nextDistrict.artists,
      cityWideArtists
    ));
    setSelectedBuilding(null);
    setDepartmentOpen(false);
    setTimeMachineOpen(false);
    setCensusOpen(false);
    setDatingOpen(false);
    setRecordShopOpen(false);
    setBackupOpen(false);
  }


  function locateArtist(districtIndex: number, name: string, rank: number) {
    if (!city || loading || travelLoading) return;
    const district = districts[districtIndex];
    if (!district) return;
    const currentArtists = districts.flatMap((item) => item.artists);
    const nextCity = generateCity(city.username, district.artists, currentArtists);
    const building = nextCity.buildings.find((item) =>
      item.type === 'artist' && item.name === name && item.rank === rank);
    if (!building) return;
    setActiveDistrictIndex(districtIndex);
    setCity(nextCity);
    setSelectedBuilding(building);
    if (dataSource) recordDistrictVisit(city.username, dataSource, district.id);
    setDepartmentOpen(false);
    setTimeMachineOpen(false);
    setDatingOpen(false);
    setRecordShopOpen(false);
    setCensusOpen(false);
    document.querySelector('.main-layout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function copyCityLink() {
    if (!city || dataSource !== 'lastfm') return;
    const link = new URL(window.location.pathname, window.location.origin);
    link.searchParams.set('user', city.username);
    link.hash = '';
    try {
      await navigator.clipboard.writeText(link.toString());
      setShareMessage('City link copied! The public username will be pre-filled on the city builder.');
    } catch {
      setShareMessage(`Copy this link: ${link.toString()}`);
    }
  }

  /* =====================================
     BUILDING INTERACTIONS
  ===================================== */

  function handleSelectBuilding(building: CityBuilding) {
    if (building.type === 'recordShop') {
      setSelectedBuilding(null);
      setRecordShopOpen(true);
      return;
    }
    setSelectedBuilding(building);

    if (building.type === 'cityHall') {
      setDepartmentOpen(true);
      recordActivity('city-hall');
    }

    if (building.type === 'clockTower') {
      setTravelError('');
      setHistoricalProgress(null);
      setTimeMachineOpen(true);
    }

    // Open the Census Office.
    if (building.type === 'censusOffice') {
      if (dataSource === 'lastfm') {
        setCensusOpen(true);
        recordActivity('census-visitor');
      }
    }
    // Open the Music Taste Dating Profile.
    if (building.type === 'matchmakingAgency') {
      setDatingOpen(true);
      recordActivity('matchmaking-visitor');
    }

  }

  /* =====================================
     GENERATE REAL LAST.FM CITY
  ===================================== */

  async function handleGenerateCity(username: string) {
    setLoading(true);
    setError('');

    // Reset the previous city and any historical report.
    setCity(null);
    setTownCenterCity(null);
    setDistricts([]);
    setActiveDistrictIndex(0);
    setSelectedBuilding(null);
    setDepartmentOpen(false);
    setTimeMachineOpen(false);
    setDataSource(null);
    setSelectedPeriod('overall');
    setTravelError('');
    setHistoricalEraLabel(null);
    setHistoricalProgress(null);
    setHistoricalSummary(null);
    setHistoricalTimelineYear(null);
    setCensusOpen(false);
    setDatingOpen(false);
    setPassportOpen(false);
    setRecordShopOpen(false);
    setBackupOpen(false);
    try {
      const artists = await getTopArtists(username, 'overall', 100);

      if (artists.length === 0) {
        throw new Error('This user has no top artists available.');
      }

      showFirstDistrict(username, artists, 'lastfm');
      setDataSource('lastfm');
    } catch (err) {
      console.error('Failed to generate city:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong loading Last.fm.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================
     GENERATE DEMO CITY
  ===================================== */

  function handleDemoCity() {
    setError('');
    setLoading(false);
    setSelectedBuilding(null);
    setDepartmentOpen(false);
    setTimeMachineOpen(false);
    setSelectedPeriod('overall');
    setTravelError('');
    setHistoricalEraLabel(null);
    setHistoricalProgress(null);
    setHistoricalSummary(null);
    setHistoricalTimelineYear(null);
    setRecordShopOpen(false);
    showFirstDistrict('Demo Listener', mockArtists, 'demo');
    setDataSource('demo');
    setCensusOpen(false);
    setDatingOpen(false);
  }

  /* =====================================
     QUICK TIME TRAVEL
     Built-in Last.fm periods
  ===================================== */

  async function handleTimeTravel(period: LastFmPeriod): Promise<void> {
    if (!city || dataSource !== 'lastfm') return;

    // Skip fetching only if this exact Quick Travel era is displayed.
    if (period === selectedPeriod && historicalEraLabel === null) {
      setTimeMachineOpen(false);
      return;
    }

    setTravelLoading(true);
    setTravelError('');
    setHistoricalProgress(null);

    try {
      const artists = await getTopArtists(city.username, period, 100);

      if (artists.length === 0) {
        throw new Error('No artists were found for this period.');
      }

      showFirstDistrict(city.username, artists, 'lastfm');
      recordActivity('time-traveler');
      setSelectedPeriod(period);
      setHistoricalEraLabel(null);
      setHistoricalTimelineYear(null);
      setHistoricalSummary(null);
      setSelectedBuilding(null);
      setTimeMachineOpen(false);
    } catch (err) {
      console.error('Quick time travel failed:', err);
      setTravelError(
        err instanceof Error
          ? err.message
          : 'Could not load this listening period.'
      );
    } finally {
      setTravelLoading(false);
    }
  }

  /* =====================================
     ADVANCED HISTORICAL TIME TRAVEL
     Calendar years, months, custom dates
  ===================================== */

  async function handleHistoricalTravel(
    startDate: Date,
    endDate: Date,
    label: string
  ): Promise<void> {
    if (!city || dataSource !== 'lastfm') return;

    setTravelLoading(true);
    setTravelError('');
    setHistoricalProgress(null);

    try {
      const result = await getCachedHistoricalArtistChart(
        city.username,
        startDate,
        endDate,
        {
          onProgress: (progress) => {
            setHistoricalProgress(progress);
          },
        }
      );

      if (result.artists.length === 0) {
        throw new Error(
          'No completed scrobbles were found during this historical period.'
        );
      }

      // The report still covers every artist in the complete archive.
      // The explorable city displays the top 100 across districts.
      showFirstDistrict(city.username, result.artists.slice(0, 100), 'lastfm');
      recordActivity('archive-explorer');
      // Count a year only when the FULL calendar year has been reconstructed,
      // not when selecting a month or arbitrary date range.
      const year = startDate.getUTCFullYear();
      const isFullYear = label.trim() === String(year) &&
        startDate.getUTCMonth() === 0 && startDate.getUTCDate() === 1 &&
        (endDate.getTime() >= Date.UTC(year + 1, 0, 1) ||
          (year === new Date().getUTCFullYear() && endDate.getTime() <= Date.now()));
      if (isFullYear) recordActivity('study-year', undefined, { years: [year] });
      setHistoricalEraLabel(label);
      setHistoricalTimelineYear(startDate.getUTCFullYear());
      setHistoricalSummary({
        totalScrobbles: result.totalScrobbles,
        totalArtists: result.totalArtists,
        topArtist: result.artists[0].name,
        pagesFetched: result.pagesFetched,
      });
      setSelectedBuilding(null);
      setTimeMachineOpen(false);

      console.info('Historical city generated:', {
        username: city.username,
        period: label,
        totalScrobbles: result.totalScrobbles,
        totalArtists: result.totalArtists,
        pagesFetched: result.pagesFetched,
      });
    } catch (err) {
      console.error('Historical time travel failed:', err);
      setTravelError(
        err instanceof Error
          ? err.message
          : 'Could not reconstruct this historical period.'
      );
    } finally {
      setTravelLoading(false);
    }
  }

  /* =====================================
     MAIN WEBSITE INTERFACE
  ===================================== */

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-decoration">☁️ ✨ ☁️</div>
        <div className="hero-badge">A LITTLE WORLD MADE OF MUSIC</div>
        <h1>🏡 Scrobble City</h1>
        <p className="hero-description">
          Every artist is a building.
          Every scrobble tells a story.
          Welcome to your own musical world!
        </p>

        <UsernameForm
          onSubmit={handleGenerateCity}
          onDemo={handleDemoCity}
          loading={loading}
        />
        <button type="button" className="privacy-small-link" onClick={() => setPrivacyOpen(true)}>
          🔎 How Scrobble City uses Last.fm data
        </button>

        <a
          className="privacy-small-link"
          href="https://ellipticbean.github.io/scrobble-world/"
          target="_blank"
          rel="noopener noreferrer"
        >
          🌍 Explore Scrobble World ↗
        </a>

        {error && (
          <div className="error-message" role="alert">
            ⚠️ {error}
          </div>
        )}
      </header>

      {city ? (
        <>
          <div className="city-status">
            <span>🌸 WELCOME, {city.username.toUpperCase()}!</span>
            <span>
              {dataSource === 'demo' ? 'DEMO DATA' : (
                <a className="city-status-lastfm-link" href={lastFmUserUrl(city.username)}
                  target="_blank" rel="noopener noreferrer" title="Open this public Last.fm profile">
                  CONNECTED TO LAST.FM ↗
                </a>
              )}
            </span>
            <span>
              ERA: {historicalEraLabel ?? periodLabels[selectedPeriod]}
            </span>
            <button
              type="button"
              className="period-change-button"
              onClick={() => {
                setTravelError('');
                setHistoricalProgress(null);
                setTimeMachineOpen(true);
              }}
            >
              🕰️ CHANGE ERA
            </button>

            {dataSource === 'lastfm' && (
              <button
                type="button"
                className="census-open-button"
                onClick={() => { setCensusOpen(true); recordActivity('census-visitor'); }}
              >
                📋 CENSUS OFFICE
              </button>
            )}

            <button
              type="button"
              className="passport-open-button"
              onClick={() => setPassportOpen(true)}
            >
              📖 VISITOR PASSPORT
            </button>
            <button type="button" className="passport-open-button"
              onClick={() => setBackupOpen(true)}>📦 SAVE PROGRESS</button>
            {dataSource === 'lastfm' && <button type="button" className="passport-open-button"
              onClick={() => { void copyCityLink(); }}>🔗 SHARE CITY</button>}

          </div>
          {shareMessage && <p className="city-share-message" role="status">{shareMessage}</p>}

          {historicalEraLabel && historicalSummary && (
            <>
              <HistoricalSummary
                era={historicalEraLabel}
                summary={historicalSummary}
              />

              {historicalTimelineYear !== null && (
                <HistoricalTimeline
                  key={historicalEraLabel}
                  currentEraLabel={historicalEraLabel}
                  initialYear={historicalTimelineYear}
                  loading={travelLoading}
                  error={travelError}
                  progress={historicalProgress}
                  onTravel={handleHistoricalTravel}
                />
              )}
            </>
          )}


          {districts.length > 0 && (
            <DistrictNavigator
              districts={districts}
              activeDistrictIndex={activeDistrictIndex}
              onSelectDistrict={handleSelectDistrict}
              disabled={loading || travelLoading}
            />
          )}

          <ArtistFinder districts={districts} onLocate={locateArtist} disabled={loading || travelLoading} />

          <main className="main-layout">
            <CityMap
              city={city}
              district={districts[activeDistrictIndex]}
              totalArtists={districts.reduce((sum, district) => sum + district.artists.length, 0)}
              onSelectBuilding={handleSelectBuilding}
              onOpenPassport={() => setPassportOpen(true)}
              onOpenRecordShop={() => { setSelectedBuilding(null); setRecordShopOpen(true); }}
              onReadNotice={() => recordActivity('community-spirit')}
              onTalkToCitizen={(residentId) => recordActivity('talk', residentId)}
              onNightVisit={() => recordActivity('night-owl')}
            />
            <InfoPanel
              building={selectedBuilding}
              demo={dataSource === 'demo'}
              onClose={() => setSelectedBuilding(null)}
            />
          </main>

          {recordShopOpen && (
            <RecordShop
              key={`${city.username}-${activeDistrictIndex}-${historicalEraLabel ?? selectedPeriod}`}
              city={city}
              districtName={districts[activeDistrictIndex]?.name ?? 'Town Center'}
              ownerKey={passportOwnerKey(dataSource ?? 'demo', city.username)}
              eraLabel={historicalEraLabel ?? periodLabels[selectedPeriod]}
              onCollectRecord={() => recordActivity('record-collector')}
              onClose={() => setRecordShopOpen(false)}
            />
          )}

          {backupOpen && <ProgressBackup
            username={city.username}
            ownerKey={passportOwnerKey(dataSource ?? 'demo', city.username)}
            onClose={() => setBackupOpen(false)} />}

          {departmentOpen && (
            <MusicalAffairs
              city={townCenterCity ?? city}
              onClose={() => setDepartmentOpen(false)}
            />
          )}

          {timeMachineOpen && (
            <MusicTimeMachine
              city={city}
              currentPeriod={selectedPeriod}
              loading={travelLoading}
              error={travelError}
              demo={dataSource === 'demo'}
              onTravel={handleTimeTravel}
              historicalEraLabel={historicalEraLabel}
              historicalProgress={historicalProgress}
              onHistoricalTravel={handleHistoricalTravel}
              onClose={() => setTimeMachineOpen(false)}
            />
          )}

          {censusOpen && dataSource === 'lastfm' && (
            <CensusOffice
              username={city.username}
              onClose={() => setCensusOpen(false)}
              onComparisonSuccess={(earlierYear, laterYear) => {
                recordActivity('compare-years', undefined, { years: [earlierYear, laterYear] });
              }}
            />
          )}

          {passportOpen && (
            <VisitorPassport
              username={city.username}
              districts={districts}
              activeDistrictIndex={activeDistrictIndex}
              stamps={passportState?.ownerKey === passportOwnerKey(
                dataSource ?? 'demo', city.username
              ) ? passportState.stamps : []}
              achievements={achievementState?.ownerKey === passportOwnerKey(
                dataSource ?? 'demo', city.username
              ) ? achievementState.progress : loadAchievements(passportOwnerKey(
                dataSource ?? 'demo', city.username
              ))}
              onTravelToDistrict={(index) => {
                handleSelectDistrict(index);
                setPassportOpen(false);
              }}
              onClose={() => setPassportOpen(false)}
              travelDisabled={loading || travelLoading}
            />
          )}

          {/* Music Taste Dating Profile */}
          {datingOpen && (

            <MusicDatingProfile
              city={townCenterCity ?? city}
              eraLabel={
                historicalEraLabel ?? periodLabels[selectedPeriod]
              }
              demo={dataSource === 'demo'}
              onClose={() => setDatingOpen(false)}
              onComparisonSuccess={(score) => {
                if (dataSource === 'lastfm') {
                  recordActivity('compare-listeners', undefined, { score });
                }
              }}
            />

          )}

        </>
      ) : (
        <section className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <h2>Your city is waiting to grow...</h2>
          <p>
            Enter your Last.fm username to plant
            the seeds of your musical world.
          </p>
        </section>
      )}

      {achievementToast && (
        <aside className="achievement-toast" role="status" aria-live="polite">
          <span className="achievement-toast-icon">{
            ACHIEVEMENTS.find((item) => item.id === achievementToast)?.icon ?? '🏅'
          }</span>
          <div>
            <small>✦ ACHIEVEMENT UNLOCKED ✦</small>
            <strong>{ACHIEVEMENTS.find((item) => item.id === achievementToast)?.name}</strong>
          </div>
          <button type="button" aria-label="Dismiss achievement notification"
            onClick={() => setAchievementToasts((notices) => notices.slice(1))}>✕</button>
        </aside>
      )}

      {privacyOpen && <PrivacyNotice onClose={() => setPrivacyOpen(false)} />}

      <footer className="site-footer">
        <p>♪ Made with music, memories, and a little bit of magic ♪</p>
        <p>
          <a href="https://www.last.fm/" target="_blank" rel="noopener noreferrer">Powered by Last.fm ↗</a> · Public listening data used with permission.
          Scrobble City is an independent, unofficial fan project and is not endorsed by Last.fm.
        </p>
        <p>Public listening data builds your city. Fictional records, passports, and badges are saved in your browser.</p>
        <button type="button" className="privacy-footer-link" onClick={() => setPrivacyOpen(true)}>
          Privacy &amp; data usage
        </button>
        <span className="site-footer-divider" aria-hidden="true"> · </span>
        <a href="https://www.last.fm/" target="_blank" rel="noopener noreferrer">Visit Last.fm ↗</a>
        <p className="beta-version">Scrobble City v0.9.2 · Public launch candidate · Independent fan project</p>
      </footer>
    </div>
  );
}
