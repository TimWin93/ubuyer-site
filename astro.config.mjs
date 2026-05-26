import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://u-buyer.ru',
  integrations: [
    tailwind(),
    sitemap(),
  ],
  output: 'static',
  vite: {
    server: {
      proxy: {
        '/api/chat': {
          target: 'https://chat-36gkdx4msq-uc.a.run.app',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/chat/, ''),
        },
      },
    },
  },
});
