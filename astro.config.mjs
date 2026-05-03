import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://ubuyer.ru',
  integrations: [
    tailwind(),
  ],
  output: 'static',
});
