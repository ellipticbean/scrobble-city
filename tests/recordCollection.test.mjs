import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordId, collectRecord, loadRecords, toggleRecordFavorite, cleanRecords } from '../src/lib/recordCollection.ts';

const data = new Map();
globalThis.window = {
  localStorage: {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { data.set(key, value); },
  },
};
const pressing = { artist:'Pink Floyd', district:'Town Center', era:'All Time', rank:1, scrobbles:1887 };

test('record IDs are case insensitive and Unicode normalized', () => {
  assert.equal(recordId(' PINK FLOYD '), recordId('Pink Floyd'));
});
test('collecting a record saves it once and keeps the original acquisition', () => {
  data.clear();
  const first = collectRecord('user-one', [], pressing);
  assert.equal(first.added, true);
  assert.equal(first.records.length, 1);
  const again = collectRecord('user-one', first.records, { ...pressing, era:'2024' });
  assert.equal(again.added, false);
  assert.equal(again.records.length, 1);
  assert.equal(loadRecords('user-one')[0].era, 'All Time');
});
test('favorite and account isolation persist', () => {
  data.clear();
  const first = collectRecord('user-one', [], pressing).records;
  toggleRecordFavorite('user-one', first, recordId('Pink Floyd'));
  assert.equal(loadRecords('user-one')[0].favorite, true);
  assert.deepEqual(loadRecords('user-two'), []);
});
test('invalid saved data is ignored safely', () => {
  assert.deepEqual(cleanRecords([{ artist:'no', collectedAt:'invalid' }]), []);
});
