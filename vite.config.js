import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for now
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
  },
  plugins: [
    {
      name: 'copy-app-core',
      closeBundle() {
        const dest = 'dist/app-core.js';
        const destDir = dirname(dest);
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        copyFileSync('app-core.js', dest);
        console.log('✅ Copied app-core.js to dist folder');
      }
    }
  ]
});
