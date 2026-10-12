import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages project sites require the repository name as a base path.
// Local development and other hosts continue to use '/'.
export default defineConfig({
  plugins: [react(), {
    name: 'scrobble-city-launch-indexing',
    transformIndexHtml(html) {
      // Index only manual GitHub Pages release builds with approval gate enabled.
      const publicRelease = process.env.GITHUB_PAGES === 'true'
        && process.env.LASTFM_PUBLIC_APPROVED === 'true';
      return html.replace(
        '<meta name="robots" content="noindex, nofollow" />',
        `<meta name="robots" content="${publicRelease ? 'index, follow' : 'noindex, nofollow'}" />`,
      );
    },
  }],
  base: process.env.GITHUB_PAGES === 'true' ? '/scrobble-city/' : '/',
});
