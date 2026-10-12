# Scrobble City v0.9.2 — public-launch candidate

## Status
The project is **prepared for review**, not published. The developer reports receiving written Last.fm permission for this website. Retain the original approval email and confirm any conditions applicable to browser-only requests before high-volume public use.

## API conditions and implementation

| Condition from the supplied approval | Implementation / next action |
|---|---|
| Avoid aggressive re-requests | Neighborhood switching reuses the already loaded in-memory top-100 artist chart. Reloads and same-period comparisons use a 1-hour cached browser snapshot. Historical artist-summary cache uses a 24-hour TTL. Historical downloads pace requests at least 1.1 seconds apart, retry temporary failures with exponential backoff, and cap individual requests at 200 pages. |
| Total Last.fm storage under 100 MB | This frontend has **no centralized database**. The app limits its local top-artist cache to approximately **2 MB** per browser, and historical aggregated charts in IndexedDB to approximately **12 MB**, evicting old data. Older history caches are pruned when first accessed. Raw scrobble pages are not retained. These are conservative application limits, not a way to control the data in a visitor's unrelated browser storage. |
| Identifiable custom User-Agent on server API calls | **No API server exists.** Requests are made by visitors' browsers, which prohibit custom `User-Agent` request headers. The browser sends its ordinary origin/referrer information according to its policies. **If Last.fm requires an app-specific User-Agent for this client-only deployment, obtain clarification or add a carefully rate-limited backend proxy before launch.** Do not attempt to spoof this header in client-side fetch. |
| Permanent 'Powered by' attribution | Site footer contains a permanent linked **Powered by Last.fm** credit. Artist and username details also link to Last.fm. |
| Logo branding | App ships its own non-Last.fm artwork and an independent-project disclaimer. |
| No streaming | The fictional record shop does not play music or use Last.fm to stream audio. |
| Non-commercial | No payment systems, subscriptions or paywalls. |

## Security and privacy notes
- The public API key in `VITE_LASTFM_API_KEY` is embedded in browser JS. Use only a key approved for client-side public use. Never include your Last.fm shared secret, password, or auth tokens.
- `.env` is git-ignored. GitHub Actions' secret only keeps the key out of the repository; it **does not** make the key secret to site visitors.
- App progress remains browser local; exporting a JSON backup exposes the usernames and game progress contained in it.
- No analytics, ad scripts, backend account database, or cross-device progress sync are included.
- Review Last.fm's written conditions and any relevant policy changes before publishing.

## Test locally
1. Extract this ZIP into a **new folder**, preserving your previous working copy.
2. Open the inner `scrobble-city` project folder in VS Code.
3. Copy your existing `.env` (API key) from the old project. **Do not upload `.env` to GitHub or to ChatGPT.**
4. Run `npm ci`, `npm run test`, `npm run lint`, `npm run build`, `npm run dev`.
5. On `http://localhost:5173/`, enter a Last.fm username and verify that it works. Open developer tools Network: moving between neighborhoods should not trigger new Last.fm chart requests; rebuilding the same account within an hour should also reuse cached data.
6. Check the Last.fm credit, privacy window, Time Machine, Census, Record Shop, passport, mobile layout and keyboard navigation. Export a progress backup before testing local data deletion.

## GitHub Pages (not yet published)
The repository is expected to be named `scrobble-city`. If you choose another name, change the base in `vite.config.ts`.

1. Make a **private GitHub repository** `scrobble-city` while staging if preferred, and push source files. Do **not** commit `.env`, `node_modules` or `dist`.
2. In repository **Settings → Secrets and variables → Actions → Secrets**, create `VITE_LASTFM_API_KEY` with only the public read-only API key. The key will be visible in the compiled JS after deployment.
3. In **Settings → Pages**, select **GitHub Actions** as the source.
4. After reviewing Last.fm's written permission/conditions, set Actions **Variables** `LASTFM_PUBLIC_APPROVED` to exactly `true`. Before setting it, the workflow cannot deploy.
5. Open **Actions → Deploy Scrobble City to GitHub Pages → Run workflow**. There is **no automatic push trigger**. The release build switches the robots meta tag to `index, follow`.
6. Test `https://YOUR_GITHUB_NAME.github.io/scrobble-city/` in a new browser/profile: last.fm API, relative assets, sharing links, mobile and privacy.
7. Once live checks pass, share the public beta link and add it to the portfolio.

## Remaining launch gate
Written permission has been reported. The specific User-Agent wording refers to *server* requests, which this frontend does not make. If that was intended to apply even to browser-only apps, get an explicit exception or move API requests through a proxy before public promotion.
