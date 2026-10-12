import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimatedBytes, retainWithinBudget } from '../src/lib/cacheBudget.ts';

const now = 1_000_000;
const policy = { ttlMs: 1_000, maxBytes: 600, maxEntries: 2 };
const item = (key, savedAt, payload = 'data') => ({ key, savedAt, payload });

test('cache evicts expired entries, respects max entries and keeps newest records', () => {
  const result = retainWithinBudget([
    item('old', now - 2000), item('newest', now - 2),
    item('middle', now - 3), item('third', now - 4),
  ], policy, now);
  assert.deepEqual(result.map((entry) => entry.key), ['newest','middle']);
});

test('cache respects approximate byte cap and ignores duplicate cache keys', () => {
  const large = item('large', now - 1, 'X'.repeat(500));
  const small = item('same', now - 2);
  const duplicate = item('same', now - 5);
  const result = retainWithinBudget([large, small, duplicate], policy, now);
  assert.deepEqual(result.map((entry) => entry.key), ['same']);
  assert.ok(estimatedBytes(result) < policy.maxBytes);
});

test('cache rejects future-dated or malformed entries', () => {
  const result = retainWithinBudget([
    item('future', now + 200), { key: 'broken', savedAt: NaN }, item('okay', now),
  ], policy, now);
  assert.deepEqual(result.map((entry) => entry.key), ['okay']);
});
