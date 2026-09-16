import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://g3z.github.io',
  base: '/minipc-finder',
  integrations: [preact()],
});
