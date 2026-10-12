# Scrobble City — release candidate test checklist

This is the developer's manual acceptance checklist. A source syntax check is **not** the same as a full browser regression test.

## First run
- [ ] Back up your current project and keep the old folder intact.
- [ ] Copy this candidate into a NEW local project directory.
- [ ] Copy your public Last.fm API key into `.env` (do not upload `.env`).
- [ ] Run `npm ci`, `npm run test`, `npm run build`, and `npm run dev`.
- [ ] Test desktop and narrow/mobile browser windows.

## Core features
- [ ] Build `MintyCorpse` and verify the first 15 artists and 100-artist district navigation.
- [ ] Switch through all seven districts; artist clicks, stairs, road animations, and shop door work.
- [ ] Search for an artist in an outer district; jump to their info panel.
- [ ] Use Department of Musical Affairs, Time Machine, Census, Matchmaking, compatibility certificate download.
- [ ] Verify historical year/month/custom period, progress bar, and errors; check no mixed-up username data.
- [ ] Talk to residents, preview town events, collect all neighborhood stamps, and unlock badges.
- [ ] Compare two users and two years; verify badge unlock only after successful comparisons.
- [ ] Set Day/Sunset/Night/Auto and Pause Movement.

## New record collection
- [ ] Open The Needle & Nook in Town Center; choose New Arrivals, pick an artist, and collect the sleeve.
- [ ] Verify new **Record Collector** achievement (14 badges total).
- [ ] Try to collect the same artist twice — there should be only one pressing in the shelf.
- [ ] Browse My Collection, search, select Favorites only, toggle favorites.
- [ ] Switch neighborhoods and eras and collect new artists, then return and verify your shelf persists.
- [ ] Refresh your browser; check all collected records still exist.
- [ ] Switch to a different Last.fm username or the Demo City; check records/stamps/badges don't leak between listeners.

## Sharing and backup
- [ ] Copy a City Link; open in a fresh browser and confirm username is pre-filled (no automatic access to private account data).
- [ ] Download progress backup JSON; import for the same listener, then refresh.
- [ ] Confirm a different username's backup is refused.
- [ ] Try an invalid/empty/oversized JSON; see a friendly error, not a crash.

## Public readiness
- [ ] Check the public website with invalid username, brand-new account, missing API key, rate limit, and offline mode.
- [ ] Test long and non-Latin artist names, keyboard navigation, Escape closure, visible focus, and reduced-motion behavior.
- [ ] Verify GitHub Pages base path, favicon, bundle, and API key strategy on a temporary public beta URL.
- [ ] Confirm Last.fm terms/branding and publish a concise privacy note.
- [ ] Share the beta with at least 2–3 other Last.fm users; triage reported issues.


## v0.9.1 pre-release safety and privacy verification
- [ ] On localhost, open **Privacy & data usage** from the homepage and footer; check Escape, keyboard focus, and small screens.
- [ ] Confirm Last.fm footer attribution, linked public username, and artist profile links go to `last.fm` and open without altering game progress.
- [ ] Confirm phone map shows the sideways swipe hint, keyboard focus highlights the map, and arrow keys can scroll it.
- [ ] Invalid/nonexistent usernames give a clear error; offline and rate-limited responses do not crash the website.
- [ ] **Export a backup first**, then test Clear local Scrobble City data; refresh and check cleared stamps, badges, vinyl, preferences, and cached history. Restore backup afterward.
- [ ] Verify `npm run test` now passes **8** tests, then run `npm run build`, `npm run lint` and browser checks.
- [ ] Verify GitHub Actions deploy workflow does **not** trigger on pushes, and the approval variable remains unset while Last.fm approval is pending.
- [ ] Do not deploy or publish the public beta without written Last.fm permission; check the API/branding conditions when they reply.

## v0.9.2 launch candidate verification
- [ ] `npm ci`, `npm run test`, `npm run lint` and `npm run build` pass.
- [ ] The footer permanently shows **Powered by Last.fm** linking to `https://www.last.fm/`.
- [ ] The privacy information explains top-artist/historical cache limits and the public frontend key.
- [ ] After building a real city, visiting all seven neighborhoods does not trigger more top-artist API calls.
- [ ] Rebuilding a city for the same username within an hour loads the top chart from browser cache.
- [ ] Quick Travel for a different era works and the cache respects the selected period.
- [ ] Historical Time Machine and Census requests still work, and repeating a completed historical request uses the cached aggregate.
- [ ] Records, favorites, passport stamps and achievements persist after refreshing.
- [ ] The Last.fm logo is not used as the Scrobble City icon; no audio or payment features exist.
- [ ] Written Last.fm terms are retained and any server-only User-Agent condition is clarified if required.
- [ ] GitHub Pages workflow is manual and approved-variable gated; no `.env` was committed.
- [ ] The published URL works on desktop and mobile, including the `scrobble-city/` asset base.
- [ ] Live tests pass before sharing Scrobble City publicly.
