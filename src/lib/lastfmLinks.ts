/** Public profile URLs only: user-supplied values are path-encoded, never treated as URLs. */
export function lastFmArtistUrl(name: string): string {
  return `https://www.last.fm/music/${encodeURIComponent(name.trim())}`;
}

export function lastFmUserUrl(username: string): string {
  return `https://www.last.fm/user/${encodeURIComponent(username.trim())}`;
}
