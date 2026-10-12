# Scrobble City — Master Roadmap

**Version:** 0.9.0-beta.1 master planning document  
**Updated:** 2026-10-11  
**Project:** Cozy pixel-art Last.fm world built with React, TypeScript, and Vite  
**North star:** A delightful, accurate, accessible, privacy-respecting musical city that other people can explore from their own Last.fm username.

> This is a working wishlist and development checklist, not a claim that everything is already implemented or required for launch. Check off items as they pass testing in the actual repository. The first public release should be **small, reliable, and complete** rather than delaying it until every imaginative feature is finished.

## Project status (observed in screenshots / shared code)

- [x] Last.fm username city generator and demo city
- [x] Up to 100 ranked artist buildings split across seven explorable districts
- [x] Artist information panels and building height scaling
- [x] Department of Musical Affairs parody investigation
- [x] Music Time Machine (quick periods plus historical dates)
- [x] Historical archive summary, yearly timeline, and historical caching
- [x] Census Office musical-era comparison
- [x] Music Taste Dating Profile and two-listener compatibility reports
- [x] Downloadable musical compatibility certificate
- [x] Cozy district colors, architecture, decorations, trees, and Scrobble Square
- [x] Day / sunset / night / auto lighting, pause movement setting
- [x] Walking residents, portraits, personalities, and data-derived conversations
- [x] Daily fictional neighborhood events and noticeboard
- [x] Visitor Passport and seven collectible neighborhood stamps
- [x] Achievement Guild, saved badges, and unlock toasts
- [x] Enterable Needle & Nook Record Shop, interactive shelves and shopkeeper (Step 19.7A)
- [ ] Confirm **all** present features work together in a single full-project production build (local Vite integration pending)

## Milestone definitions

- **P0 — Public-launch blocker:** Must be fixed or confirmed before publishing.
- **P1 — Public v1.0 feature:** A worthwhile release feature, but may be removed from launch scope if it jeopardizes quality.
- **P2 — Post-launch wishlist:** Fun expansion; don't block v1.0 for it.

### 1. Fix current bugs and polish stability

- [x] **P0** Replace repeated 10-name citizen roster with 159 names; verified distinct names across top 100 ranks in source (browser check pending)
- [ ] **P0** Check citizen hover speech balloons for overlap/clipping at road intersections and near building labels
- [ ] **P0** Ensure citizens never obscure or steal clicks from artist doors and landmark controls
- [ ] **P0** Confirm citizen dialogs close reliably with mouse, Escape, and keyboard focus
- [ ] **P0** Check time-of-day mode and pause behavior in all seven districts
- [ ] **P0** Test changing Last.fm usernames never mixes passport, achievements, or saved shop collections
- [ ] **P0** Test changing eras while shop, passport, or other dialogs are open (no stale artist data)
- [ ] **P0** Remove duplicate CSS selectors that accidentally override newer modules
- [ ] **P0** Remove debug leftovers, React warnings, unused exports, and TypeScript errors
- [ ] **P0** Validate 0, 1, 15, 16, 90, and 100-artist city layouts
- [ ] **P1** Add a friendly no-music / no-results city illustration and explanation
- [ ] **P1** Make long artist names readable via truncation, tooltip, or expanded plaque
- [ ] **P1** Keep decorative animation lightweight on slower laptops and phones
- [ ] **P1** Give all visitors a clear way back to Town Center

### 2. Record Shop — The Needle & Nook

- [x] **P1** Collect a free imaginary vinyl record associated with a real artist in the neighborhood (browser test pending)
- [x] **P1** Save collected records locally per Last.fm account and demo account (automated logic tested)
- [x] **P1** A **My Collection** panel with grid, count, search, and favorites (list view remains wishlist)
- [x] **P1** A record collector achievement that only unlocks after successfully collecting a record (browser test pending)
- [x] **P1** Clearly distinguish *fictional* collectible sleeves from actual Last.fm album data
- [x] **P1** Show the artist, rank, listening era, and first-collected date in record metadata (rank shown during browsing)
- [x] **P1** Avoid collecting the exact same fictional pressing repeatedly by accident (automated logic tested)
- [x] **P1** Collection empty state and persistence in browser storage (refresh test pending)
- [ ] **P2** Artist-inspired limited-edition sleeve themes for different neighborhoods
- [ ] **P2** Browse top albums and tracks when supported by Last.fm API data
- [ ] **P2** Legitimate album art with appropriate links/attribution and fallback graphics
- [ ] **P2** Rare pressings earned by historical time travel; explain rarity is game fiction
- [ ] **P2** An NPC music recommendation / scavenger-hunt system
- [ ] **P2** Turntable/preview animations; optional sound effects (no unlicensed streaming)
- [ ] **P2** Record wall, crate sorting, custom shelf labels, and collection export

### 3. World exploration and simulation

- [ ] **P1** Distinctive storefront exteriors and inviting signage for all attractions
- [ ] **P1** Consistent art scale between record shop, artist buildings, and citizen sprites
- [ ] **P1** Proper entrance/exit paths for the record store and other interactive interiors
- [x] **P1** City directory/search that locates a particular artist and district (top 100; browser test pending)
- [ ] **P1** Mini-map or overview of all seven districts for navigation
- [ ] **P2** Camera panning, zoom, and seamless travel between districts (instead of isolated screens)
- [ ] **P2** More artist capacity than top 100 via lazy-loaded districts
- [ ] **P2** Different street layouts: alleys, bridges, parks, corners, and small plazas
- [ ] **P2** Tiny parks, cafés, record stalls, a library of old music, or listening benches
- [ ] **P2** Night market and seasonal decorations without implying real events
- [ ] **P2** More detailed sprites, animated doors, cats, birds, flowers, rain, and weather
- [ ] **P2** Consistent named NPC identities across listening eras, not only within a ranking
- [ ] **P2** Citizen preferences, home assignments, scripted routines, and greeting variations
- [ ] **P2** Interactive story quests with earned rewards
- [ ] **P2** Music-room / apartment personalization and furniture placement

### 4. Last.fm coverage, reliability, and accuracy

- [ ] **P0** Test invalid usernames, account renames, accounts with very few scrobbles, deleted artists, and Unicode names
- [ ] **P0** Proper Last.fm API failure, timeout, and network-offline error states
- [ ] **P0** Confirm numeric parsing, rank ordering, and total vs. top-artists labels are correct
- [ ] **P0** Cache repeated historical requests safely; do not mix results between usernames or date periods
- [ ] **P0** Give historical requests cancellation, progress, pagination, and retry on transient failures
- [ ] **P0** Check API rate limits and permitted public use; verify relevant terms before deployment
- [ ] **P0** Review client-exposed `VITE_` environment variables; never expose an API secret or tokens
- [ ] **P1** Indicate whether a number covers top 15, top 100, or the complete selected archive
- [ ] **P1** All-time/12m/6m/3m/1m/7d selectable throughout compatible modules
- [ ] **P1** User-defined start/end date picker with timezone and inclusive date-edge consistency
- [ ] **P1** Optional rolling period vs. calendar year distinctions in the UI
- [ ] **P1** Update/pull-to-refresh for the current Last.fm account
- [ ] **P1** Inform visitors that historical fetches can take time, and support cancellations
- [ ] **P2** Full-history explorer for **all recorded artists**, beyond the current top-100 city
- [ ] **P2** Scrobble heatmap, hourly/daily habits, favorite repeat tracks, and monthly trends
- [ ] **P2** Musical eras and personalized time-capsule summaries
- [ ] **P2** Album/track exploration with valid Last.fm attribution and source links
- [ ] **P2** Real-time recent scrobble ticker, off by default / sensible refresh intervals

### 5. Existing attraction improvements

- [ ] **P1** Department of Musical Affairs: more diverse findings for different listening patterns
- [ ] **P1** Time Machine: clean loading, cancellation, navigation, and accurate era headers
- [ ] **P1** Census Office: readable changed-rank tables, large-list performance, shareable summary
- [ ] **P1** Matchmaking Agency: explain scoring is playful and based on limited top-100 data
- [ ] **P1** Compatibility certificate: verify legible text, margins, high-resolution PNG export
- [ ] **P1** Mark the 13 achievement conditions and ensure rewards don't trigger on failed requests
- [ ] **P2** More parody cases, surprise investigation charges, optional printable verdict
- [ ] **P2** Taste-overlap view with weighted artist overlap and score explanation
- [ ] **P2** Album/track overlap between two listeners where data is available
- [ ] **P2** “Same artist, different era” comparisons and animated skyline transitions

### 6. Passport, achievements, and saves

- [ ] **P0** Old passport stamps and achievements survive every update
- [ ] **P0** Achievement progress cannot unlock falsely on an error or cancelled action
- [ ] **P1** Add record collecting badges and a finished record-shop visit stamp
- [ ] **P1** Clearly show what is stored on this browser and that it does not sync between devices
- [x] **P1** Backup/export and import local progress as JSON (manual migration; browser test pending)
- [ ] **P1** Show badge earned date and details without overflowing on phones
- [ ] **P2** Rare neighborhood souvenirs and quests
- [ ] **P2** Decorative passport themes, stickers, optional badges on public share images
- [ ] **P2** Opt-in account-based syncing, only if adding a secure backend and privacy policy

### 7. Sharing and growth

- [x] **P1** Copy link to a user's city using safe URL query parameters (browser test pending)
- [ ] **P1** Share or download a postcard-style preview of a favorite neighborhood
- [ ] **P1** Shareable compatibility report and certificate already available; retest before launch
- [ ] **P1** Social preview card (Open Graph), favicon, page title, and project description
- [ ] **P1** Link to source Last.fm profiles for visitors who want to explore the actual data
- [ ] **P2** Downloadable scrapbook-style completed passport (image)
- [ ] **P2** City screenshots / panorama export
- [ ] **P2** Surprise city trivia cards and listening-personality summaries
- [ ] **P2** User-supplied customization such as town nickname, colors, and avatar

### 8. Mobile, keyboard, and accessibility

- [ ] **P0** Responsive layout at 320px, 375px, 768px, laptop, and wide desktop sizes
- [ ] **P0** No horizontal scrolling caused by modal windows, tab bars, city grid, or long names
- [ ] **P0** Operable buttons and building cards using keyboard only; visible focus styles
- [ ] **P0** Modal focus trap, restored focus, and Escape dismissal
- [ ] **P0** Tooltips and dialogues accessible to screen readers, not hover-only
- [ ] **P0** WCAG-minded contrast and legible text at 200% zoom
- [ ] **P0** Respect `prefers-reduced-motion` and allow pausing nonessential animations
- [ ] **P1** Touch-friendly buttons and drag/scroll gestures
- [ ] **P1** Sound muted by default; clearly labeled opt-in, with pause/volume
- [ ] **P1** Loading states announced politely via screen reader
- [ ] **P1** Color is never the only indicator for completion, rank, or selection

### 9. Performance and development quality

- [ ] **P0** Clean `npm run build`, typecheck, lint, and test commands
- [ ] **P0** Search for runtime exceptions and unhandled promise rejections
- [ ] **P0** Avoid repeated data fetching on every render or dialog open
- [ ] **P0** Remove accidental duplicate expensive historical requests
- [ ] **P1** Vitest unit tests for district ranks, city height scaling, historical date ranges, achievement persistence
- [ ] **P1** Playwright/other browser smoke tests for main city flow and Last.fm sample API responses
- [ ] **P1** Test localStorage disabled, corrupt, or blocked and handle gracefully
- [ ] **P1** Lazy-load large modals; split large React modules into smaller pieces
- [ ] **P1** Performance profiling on a midrange phone and throttled network
- [ ] **P1** Error boundary with recover/reload action
- [ ] **P1** Extract themed UI tokens and reduce duplicated CSS selectors
- [ ] **P1** Add a changelog, README, contributor notes, and test fixtures
- [ ] **P2** CI screenshot comparison and visual regression coverage

### 10. Security, trust, and legal readiness

- [ ] **P0** Remove `.env` and `.env.*` secrets from any release archive and Git history
- [ ] **P0** Ensure Last.fm *API secret* / auth tokens are never embedded in browser JavaScript
- [ ] **P0** Confirm public Last.fm API usage, branding, caching, attribution, and data/licensing rules
- [ ] **P0** Safely render usernames/artist names as text, not unsanitized HTML
- [ ] **P0** Do not store Last.fm passwords or ask users for authentication unnecessarily
- [ ] **P0** Publish a plain-language privacy note explaining public Last.fm data, local saves, and any analytics
- [ ] **P0** Avoid implying residents, concerts, album covers, or scores are official Last.fm facts
- [ ] **P1** Clear demo mode disclosures and link to Last.fm
- [ ] **P1** Open-source licensing decisions and third-party asset/font checks
- [ ] **P1** Basic Content Security Policy and sane outbound link handling
- [ ] **P1** Document how visitors can clear local game progress
- [ ] **P2** Abuse/rate limiting proxy if public API demand becomes significant

### 11. Hosting and launch

- [ ] **P0** Move complete working source into a backed-up Git repository and create a release branch
- [ ] **P0** Set appropriate Vite `base` path for GitHub Pages (or choose another host)
- [ ] **P0** Create GitHub Actions/other repeatable production build and deploy
- [ ] **P0** Verify deployed site on a second device and fresh/incognito browser
- [ ] **P0** Test public Last.fm API calls on real HTTPS domain; inspect network/console errors
- [ ] **P0** Verify asset URL paths, refresh behavior, and 404s on hosting
- [ ] **P0** Add privacy/help/about/contact info and visible beta messaging where appropriate
- [ ] **P0** Final content copy edit and attribution check
- [ ] **P1** Connect the live project from your existing portfolio
- [ ] **P1** Short tutorial/first-run guide and optional guided district tour
- [ ] **P1** Public README with feature screenshots, setup, build and release notes
- [ ] **P1** Test with at least 5–10 volunteer Last.fm accounts before removing beta label
- [ ] **P1** Set a lightweight issue tracker and feedback form (no sensitive data)
- [ ] **P1** Tag `v1.0.0`, publish a changelog, and create a rollback point

## Practical release cuts

**Launch v1.0 goal:** Existing city/4 original interactive attractions, seven themed districts, Time Machine/history, Census, matchmaking, achievements/passport, citizen dialogue, Record Shop with simple saved fictional collection, shareable results, mobile/keyboard support, good errors, documented privacy, and real HTTPS deployment.

**Can wait until v1.1+:** Seamless pan-and-zoom world, all-artists district expansion, actual album art, music playback, furniture and decorating, true social profiles, cloud sync, live events, and complex quests. These are major products, not bug fixes.

## Release strategy (requested: big integrated update)

1. Collect the **entire current source** in one archive, not independent old snippets: `src/`, `public/`, `package.json`, package lock, Vite/TSConfig/ESLint config, and `index.html`. **Exclude `.env`, `.env.local`, `node_modules/`, `dist/`**.
2. Make a `release-candidate` branch, preserve original files, and produce a coherent replacement project as one ZIP or Git commit.
3. Implement P0 blockers first, then agreed P1 features. Install automated smoke tests and mock Last.fm fixtures.
4. Run typecheck/lint/unit/browser tests; exercise accounts, history, mobile, and persistence manually.
5. Test on a temporary public preview URL and resolve regressions before production deployment.
6. Release to GitHub Pages or chosen host, link from portfolio, and keep P2 ideas in the backlog.

## Known issue / initial hotfix

The old citizen code picks a nickname from only **ten** names using a hash, so different artists (including in different districts) can become "Juniper." The supplied `Citizens.tsx` hotfix contains **159 distinct names**, allocated without collisions for global artist ranks 1–100. This is deterministic within a listening period; future persistent identity can use a global artist-to-resident registry across eras.

## Decisions to revisit

- Whether a **single release candidate** should include a record collection and save/export, or ship those in v1.1.
- Whether to keep all seven neighborhoods at 15 artist lots or make capacity dynamic beyond 100.
- Whether public sharing is **read-only URL state** or requires cloud storage/login (recommended: read-only URL, no login for v1.0).
- What name and domain to use, and whether to release as public beta first.
- Whether to keep a purely CSS-pixel-art appearance or transition gradually to custom sprite sheets/canvas.

---

**How to maintain this document:** Put it at the project root as `SCROBBLE_CITY_MASTER_ROADMAP.md`. Mark `[x]` only after the feature has been tested in your current branch. Add new discoveries under their matching sections; move good-but-not-necessary ideas to P2 to protect the launch schedule.


## Candidate integration summary (2026-10-11)

**Implemented in `0.9.0-beta.1` source:** original 19.7A build preserved; 159-name citizen roster; browser-local record collecting, collection search/favorites, record collector badge; top-100 artist finder; share-city prefilling; saved progress export/import; GitHub Pages workflow and relative base path; mobile/reduced-motion polish; automated record-storage tests.

**Checks completed here:** TypeScript/TSX parsing (all project sources), CSS parsing, 4 automated record collection tests, 159-name uniqueness and 100-rank collision test, ZIP content audit.

**Still required before public beta:** `npm ci`, `npm run build`, actual browser checks on Windows, 2–3 other users' Last.fm data, API error/rate-limit checking, keyboard/mobile testing, hosting and Last.fm policy/usage verification.

**Not bundled into this candidate:** seamless world/camera game engine, hundreds or thousands of simultaneous artist lots, full-history album/track charts, live audio, true multiplayer, cloud accounts, custom room decorator, weather simulator. Those remain post-beta wishlist items.


## v0.9.1 pre-release milestone (October 2026)
- [x] Last.fm text attribution and safe artist/user links.
- [x] In-app privacy and local data notice; manual full browser-data delete control.
- [x] Mobile swipe hint and keyboard focus visibility polish.
- [x] Manual, Last.fm-approval-gated deployment workflow (no auto-deploy on push).
- [x] Helpful invalid username and API service error messages.
- [x] Additional URL handling tests; existing passport/collection storage schema unchanged.
- [ ] Run full dependency install, TypeScript/Vite build, and browser regression locally for **v0.9.1**.
- [ ] Written Last.fm API public-use approval and review of any associated conditions.
- [ ] Public launch only after all release tests and approval complete.


## v0.9.2 — pre-public launch update (2026-10)

- [x] Keep previously completed city, matchmaking, Time Machine, Census, passport, citizen, and record collecting functionality.
- [x] Preserve local save data schemas (passport stamps, badges, records).
- [x] Cache public top-artist charts for 1 hour with a ~2 MB browser cap to avoid repeat Last.fm API requests.
- [x] Prune historical chart cache (24-hour TTL, ~12 MB, 32 entries) and clean legacy caches on first use.
- [x] Pace historical page requests at 1.1 seconds between pages.
- [x] Place explicit, permanent **Powered by Last.fm** attribution in the footer.
- [x] Document browser-only `User-Agent` restriction and API-key visibility.
- [x] Keep GitHub Pages release manual, conditioned on approval variable.
- [ ] Run full v0.9.2 `npm ci`, `npm run test`, `npm run lint`, `npm run build` on the local Windows installation.
- [ ] Clarify with Last.fm whether the `User-Agent` requirement applies to this frontend-only design, if necessary.
- [ ] Check approved GitHub Pages production URL in a new browser before announcing release.
