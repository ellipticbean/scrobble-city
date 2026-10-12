import { useEffect, useRef, useState } from 'react';

interface PrivacyNoticeProps { onClose: () => void }

/** Transparent, client-only data notice. No tracking code is introduced here. */
export default function PrivacyNotice({ onClose }: PrivacyNoticeProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled)'
      ) ?? []);
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = oldOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  function clearLocalData() {
    if (!window.confirm('Delete ALL Scrobble City stamps, badges, saved records, display preferences and historical caches for ALL usernames in this browser? This cannot be undone. Export a backup first if you want to keep your progress.')) return;
    let removed = 0;
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('scrobble-city-')) { window.localStorage.removeItem(key); removed++; }
      }
    } catch {
      setMessage('Browser storage could not be fully cleared. Use the browser settings to clear site data.');
      return;
    }
    try {
      const request = window.indexedDB.deleteDatabase('scrobble-city-history');
      request.onsuccess = () => setMessage(`Cleared ${removed} saved setting/progress entries and historical cache. Refresh the page to reload.`);
      request.onerror = () => setMessage(`Cleared ${removed} entries. Historical cache could not be deleted; clear site data in browser settings.`);
      request.onblocked = () => setMessage(`Cleared ${removed} entries. Historical cache is still in use; close other tabs for this site and clear site data.`);
    } catch {
      setMessage(`Cleared ${removed} saved entries. Clear this website's browsing data to remove historical cache.`);
    }
  }

  return (
    <div className="privacy-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="privacy-window" role="dialog" aria-modal="true" aria-labelledby="privacy-title" aria-describedby="privacy-intro">
        <div className="privacy-head">
          <div>
            <span className="privacy-eyebrow">✦ SCROBBLE CITY INFORMATION DESK ✦</span>
            <h2 id="privacy-title">🔎 Privacy &amp; Data Usage</h2>
            <p id="privacy-intro">How this little musical world works behind the scenes.</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close privacy information">✕</button>
        </div>
        <div className="privacy-body">
          <h3>♪ What we request</h3>
          <p>When you enter a Last.fm username, your browser requests that public profile's top artists and play counts from Last.fm. If you use historical travel or the Census Office, the browser also requests public scrobble history for selected dates. Comparing two users sends both public usernames to Last.fm. No Last.fm password or account login is required.</p>
          <h3>🏡 Where your progress lives</h3>
          <p>Passport stamps, achievements, imaginary records, favorites, and display settings are stored on this device in your browser's local storage. Top-artist charts are cached in localStorage for up to one hour (maximum approximately 2 MB); historical artist summaries are cached in IndexedDB for up to 24 hours (maximum approximately 12 MB). Oldest cached results are evicted. These caches contain public artist information and counts, not downloaded copies of every scrobble. This application does not operate its own user account database or sync this data to a server.</p>
          <h3>🌐 Services and sharing</h3>
          <p>Your browser communicates directly with Last.fm to load public music information. Last.fm handles requests under its own policies. The website host also handles normal requests for webpage files. Scrobble City does not include third-party ad scripts or analytics in this build. Sharing a City link shares a public username only, not your collected records or saved progress.</p>
          <h3>💿 Exports and collections</h3>
          <p>Records and souvenirs are fictional, with no purchase or audio streaming. A downloaded backup contains a username, saved achievements, stamps, and collected records. Anyone you give that backup file to can inspect its contents. Keep your backup private unless you intentionally want to share it.</p>
          <h3>🔐 API key and transparency</h3>
          <p>This browser-only frontend uses a Last.fm API key visible in the website's JavaScript and network requests. Browser security does not allow websites to set their own User-Agent request header. There is no Scrobble City API server. It does not require a Last.fm shared secret, password, or personal access token. Scrobble City is not affiliated with or endorsed by Last.fm.</p>
          <h3>🧹 Delete saved data</h3>
          <p>Clear this site's storage in your browser settings, or use the button below to delete Scrobble City's browser-stored progress and historical cache for every username on this device. This does not change anything stored at Last.fm. Make a backup first if you might want to restore your collections.</p>
          <button className="privacy-delete" type="button" onClick={clearLocalData}>🗑️ Clear local Scrobble City data</button>
          {message && <p role="status" className="privacy-feedback">{message}</p>}
          <p className="privacy-disclaimer">Powered by <a href="https://www.last.fm/" target="_blank" rel="noopener noreferrer">Last.fm ↗</a>. Please review <a href="https://www.last.fm/legal/privacy" target="_blank" rel="noopener noreferrer">Last.fm's privacy information ↗</a> for its own data handling.</p>
        </div>
      </section>
    </div>
  );
}
