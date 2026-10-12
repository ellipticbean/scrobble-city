import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passportOwnerKey, stampPassport, loadPassport } from '../src/lib/passport.ts';
import { ACHIEVEMENTS, achievementStorageKey, loadAchievements, updateAchievements } from '../src/lib/achievements.ts';

const values = new Map();
globalThis.window = { localStorage: {
  getItem(k) { return values.get(k) ?? null; },
  setItem(k,v) { values.set(k,v); },
} };

test('original passport storage key and stamps remain intact', () => {
  values.clear();
  const key = passportOwnerKey('lastfm','MintyCorpse');
  const first = stampPassport(key,'district-1');
  const second = stampPassport(key,'district-2',first);
  assert.equal(second.length,2);
  assert.equal(loadPassport(key).length,2);
  assert.notEqual(key, passportOwnerKey('demo','MintyCorpse'));
});

test('older achievement records survive adding Record Collector', () => {
  values.clear();
  const key=passportOwnerKey('lastfm','MintyCorpse');
  const earnedAt=new Date(2026,0,1).toISOString();
  values.set(achievementStorageKey(key), JSON.stringify({ earned:[{id:'night-owl',earnedAt}], residentIds:['a','b'] }));
  const previous=loadAchievements(key);
  assert.deepEqual(previous.calendarYears,[]);
  const next=updateAchievements(key,previous,'record-collector');
  assert.equal(next.newlyEarned.includes('record-collector'),true);
  assert.equal(next.progress.earned.find(a=>a.id==='night-owl')?.earnedAt,earnedAt);
  assert.equal(next.progress.residentIds.length,2);
  assert.equal(ACHIEVEMENTS.length,14);
});
