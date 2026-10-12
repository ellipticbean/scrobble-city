# 🏡 Scrobble City — release candidate

A cozy pixel-art Last.fm experience built with React 19, TypeScript and Vite.

## Run locally

1. Install Node 22+.
2. Run `npm ci`.
3. Copy `.env.example` to `.env` and set your **public** Last.fm API key.
4. Run `npm run dev` and open the address Vite prints.
5. For release testing, run `npm run test` and `npm run build`.

**Security:** A `VITE_` variable is embedded in the browser bundle. This is suitable only for a deliberately public, limited-privilege API key. **Never** put Last.fm API *secret*, passwords, or tokens into Vite client code. `.env` is Git-ignored. Read-only API calls are browser-side; local game progress remains on the device.

## New in this candidate

- Free collectible **fictional** vinyl records from The Needle & Nook; records save per Last.fm username across eras and districts.
- Searchable **My Collection**, favorites, and the **Record Collector** achievement (14 total).
- Artist directory searches the current era's top 100 and jumps to the artist's building info.
- Share City copies a URL with a prefilled public Last.fm username. It never logs anyone in.
- Save Progress downloads a JSON backup of the current visitor's stamps, achievements and records. Import merges existing data for that username; reload afterward.
- Citizen roster updated to a non-repeating rank-based set for the top 100 artist slots.
- Responsive polish, GitHub Pages workflow, user-facing site description, and test plan.

## Progress and privacy

Passport stamps, achievements and fictional record pressings use browser `localStorage` keyed by source and username. They are **not synced** across browsers/devices unless you manually export/import a backup. Other visitors cannot edit your browser storage. Last.fm listening stats obtained with the public API are treated as public data. No audio is streamed, no purchases occur, and the artwork is original CSS pixel art.

## GitHub Pages beta deployment — manual only

The project supports `https://YOUR_NAME.github.io/scrobble-city/` for a repository named `scrobble-city`.

- The developer reports written Last.fm permission to use the API for this site. Keep a copy of the email and follow all conditions.
- **Review `PUBLIC_LAUNCH_0.9.2.md` before publishing.** In particular, browser fetch cannot send a custom `User-Agent` header; ask Last.fm whether this browser-only architecture needs an exception if that condition is mandatory.
- Push the source to GitHub (do not commit `.env`). Add `VITE_LASTFM_API_KEY` to the repository's Actions **Secrets** (it is still exposed in the public browser build).
- Set Pages source to **GitHub Actions**. When all approval conditions are satisfied, create the Actions **variable** `LASTFM_PUBLIC_APPROVED=true`.
- Run **Deploy Scrobble City to GitHub Pages** manually from Actions. Pushes to the repository do not automatically deploy.
- Test your live URL in a fresh browser before inviting others.

## Cache and attribution

- Top-artist charts are kept in browser localStorage for 1 hour, subject to a ~2 MB cap. Neighborhood switching uses memory with no extra requests.
- Historical aggregated artist charts are kept for 24 hours in IndexedDB, subject to a ~12 MB cap and eviction. No raw scrobble history is stored long term.
- The site's persistent footer includes a linked **Powered by Last.fm** credit and an independent/unofficial disclaimer.
- Scrobble City has no API server, so it cannot set a custom browser `User-Agent` header. See the public-launch notes.

## Status

This is a **v0.9.2 public-launch candidate**, not yet a deployed or independently audited release. See `RELEASE_TEST_CHECKLIST.md` and `SCROBBLE_CITY_MASTER_ROADMAP.md`. Larger wishlist items (true seamless world, more than 100 live artist buildings, album-art/track integration, sound, accounts/cloud sync) remain future work.
