import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On GitHub Pages the site is served from /<repo>/; locally from /.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/calculator/' : '/',
  plugins: [react()],
});
