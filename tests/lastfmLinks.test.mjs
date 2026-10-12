import test from 'node:test';
import assert from 'node:assert/strict';
import { lastFmArtistUrl, lastFmUserUrl } from '../src/lib/lastfmLinks.ts';

test('artist URLs path-encode unsafe characters instead of treating them as destinations', () => {
  const url = new URL(lastFmArtistUrl('AC/DC & Friends'));
  assert.equal(url.origin, 'https://www.last.fm');
  assert.equal(url.pathname, '/music/AC%2FDC%20%26%20Friends');
});
test('profile URLs point only to Last.fm for shared public usernames', () => {
  const url = new URL(lastFmUserUrl('//example.com/?key=1'));
  assert.equal(url.origin, 'https://www.last.fm');
  assert.ok(url.pathname.startsWith('/user/%2F%2F'));
});
