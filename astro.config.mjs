import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: process.env.PUBLIC_SITE ?? 'https://YOUR_GITHUB_USER.github.io',
  base: process.env.PUBLIC_BASE ?? '/minipc-finder',
  integrations: [preact()],
});
