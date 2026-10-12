# Scrobble City — beta candidate 0.9.0-beta.1

**Build status:** candidate for local testing, **not yet public-release certified**.

## What's new in this integrated source snapshot

- Preserves all four original interactive attractions, Census, historical Time Machine, 7 districts, Passport/Achievements, pixel-art ambience, citizen dialogue, and The Needle & Nook.
- 159 resident names: a rank-based permutation ensures distinct names for ranks 1–100 in one listening era. A resident assigned to the same rank in another era can reuse the name; persistent named NPCs across eras are future work.
- Fictional vinyl record collection: open Record Shop, choose a shelf, click a display record, and Collect. Each artist can only be collected once for an account; first acquisition records its district/era/date. My Collection offers search and favorites.
- Record Collector achievement added. Badge total is now 14 (previously 13); old badge storage key is unchanged.
- Artist Finder: locate a specific artist among the current era's top 100, switch to their district and open their info panel.
- Share City URL: copies a link with `?user=...` that prefills the city builder. It does not grant access to private Last.fm data and does not automatically fetch.
- Backup and restore progress JSON for the *same* username and account source, merging stamps, achievements, and records. Use Refresh after importing.
- Clearer public-use footer; timeout and friendly network/rate-limit errors on top artist requests.
- GitHub Pages ready base-path configuration, workflow, `.gitignore`, `.env.example`, SEO description, and test documentation.

## Checks executed for this candidate

- 6 passing Node tests: record IDs, de-duplication, favorites, account separation, old passport stamps and achievement compatibility.
- TypeScript/TSX syntax parsing of all 35 source files.
- CSS stylesheet syntax parsing.
- 159 unique possible NPC names and collision-free mapping of ranks 1–100.

## Outstanding checks before public beta

- Complete `npm ci` and `npm run build` on your computer.
- Perform all browser tests in `RELEASE_TEST_CHECKLIST.md` (modal interactions, localStorage refresh, multiple users, historical travel, and mobile viewport).
- Review Last.fm API usage terms, throttling and security. Vite's public API key is visible in the shipped client bundle; **never include your Last.fm shared secret**.
- Test on public GitHub Pages URL; recruit a small external beta before labeling this version stable.

## Wishlist deferred to later versions

The full wishlist is preserved in `SCROBBLE_CITY_MASTER_ROADMAP.md`: seamless camera/game movement, all-time full-history browsing beyond 100 artist buildings, real album/track browsing, sound, weather and seasons, persistent NPC identities, custom rooms, cloud sync and more.
