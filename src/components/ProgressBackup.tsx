import { useRef, useState } from 'react';
import { achievementStorageKey } from '../lib/achievements';
import { collectionStorageKey, cleanRecords } from '../lib/recordCollection';
import { loadPassport } from '../lib/passport';

interface Props { ownerKey: string; username: string; onClose: () => void }

export default function ProgressBackup({ ownerKey, username, onClose }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  function exportBackup() {
    try {
    const backup = {
      version: 1, username, ownerKey,
      savedAt: new Date().toISOString(),
      stamps: loadPassport(ownerKey),
      achievements: JSON.parse(window.localStorage.getItem(achievementStorageKey(ownerKey)) ?? 'null') as unknown,
      records: cleanRecords(JSON.parse(window.localStorage.getItem(collectionStorageKey(ownerKey)) ?? '[]') as unknown),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scrobble-city-${username.replace(/[^\w-]/g, '_')}-progress.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Backup downloaded. Keep this JSON file somewhere safe.');
    } catch {
      setMessage('Could not prepare a backup. Browser storage might be blocked or damaged.');
    }
  }

  async function importBackup(file: File) {
    if (file.size > 2_000_000) { setMessage('The backup is too large (maximum 2 MB).'); return; }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup file');
      const value = parsed as Record<string, unknown>;
      if (value.version !== 1 || value.ownerKey !== ownerKey || typeof value.username !== 'string' ||
          value.username.trim().toLocaleLowerCase() !== username.trim().toLocaleLowerCase() ||
          !Array.isArray(value.stamps) || !Array.isArray(value.records) ||
          (!value.achievements || typeof value.achievements !== 'object')) {
        throw new Error('That backup does not match this Last.fm username or format.');
      }
      const originalStamps = loadPassport(ownerKey);
      const validStamps = value.stamps.filter((stamp): stamp is { districtId: string; stampedAt: string } => {
        if (!stamp || typeof stamp !== 'object') return false;
        const s = stamp as Record<string, unknown>;
        return typeof s.districtId === 'string' && /^district-[1-9]\d*$/.test(s.districtId) &&
          typeof s.stampedAt === 'string' && Number.isFinite(Date.parse(s.stampedAt));
      });
      const stamps = [...new Map([...originalStamps, ...validStamps].map((s) => [s.districtId, s])).values()];
      const originalRecords = cleanRecords(JSON.parse(window.localStorage.getItem(collectionStorageKey(ownerKey)) ?? '[]') as unknown);
      const records = [...new Map([...originalRecords, ...cleanRecords(value.records)].map((r) => [r.id, r])).values()];
      // Other saved achievements are preserved: merge by ID before importing.
      const prior = JSON.parse(window.localStorage.getItem(achievementStorageKey(ownerKey)) ?? '{}') as Record<string, unknown>;
      const incoming = value.achievements as Record<string, unknown>;
      const achievementObjects = [...(Array.isArray(prior.earned) ? prior.earned : []), ...(Array.isArray(incoming.earned) ? incoming.earned : [])];
      const earned = [...new Map(achievementObjects.filter((a): a is { id: string } => !!a && typeof a === 'object' && typeof (a as { id?: unknown }).id === 'string').map((a) => [a.id, a])).values()];
      const residentIds = [...new Set([...(Array.isArray(prior.residentIds) ? prior.residentIds : []), ...(Array.isArray(incoming.residentIds) ? incoming.residentIds : [])].filter((v): v is string => typeof v === 'string'))];
      const calendarYears = [...new Set([...(Array.isArray(prior.calendarYears) ? prior.calendarYears : []), ...(Array.isArray(incoming.calendarYears) ? incoming.calendarYears : [])].filter((v): v is number => typeof v === 'number' && Number.isInteger(v)))];
      if (!window.confirm('Merge this backup into your existing stamps, badges, and record collection for this listener?')) return;
      window.localStorage.setItem(ownerKey, JSON.stringify(stamps));
      window.localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(records));
      window.localStorage.setItem(achievementStorageKey(ownerKey), JSON.stringify({ earned, residentIds, calendarYears }));
      setMessage('Backup restored. Refresh this page to load the imported progress.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to read this backup.');
    }
  }
  return <div className="progress-backup-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="progress-backup-window" role="dialog" aria-modal="true" aria-labelledby="backup-title">
      <button className="progress-backup-close" type="button" onClick={onClose} aria-label="Close">✕</button>
      <span className="progress-backup-eyebrow">SCROBBLE CITY • TRAVEL DOCUMENTS</span>
      <h2 id="backup-title">📦 Save your city progress</h2>
      <p>Passport stamps, achievements, and fictional records are saved only in this browser. You can download a backup and restore it for the <strong>same listener</strong> on another device.</p>
      <div className="progress-backup-buttons">
        <button type="button" onClick={exportBackup}>⬇ Download my progress</button>
        <button type="button" onClick={() => input.current?.click()}>⬆ Restore a backup</button>
      </div>
      <input ref={input} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importBackup(file); event.target.value = ''; }} />
      {message && <p role="status" className="progress-backup-notice">{message}</p>}
      <small>Only import a backup you created. This file contains your chosen Last.fm username and saved game progress, not your Last.fm password.</small>
    </section>
  </div>;
}
