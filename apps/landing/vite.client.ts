import { defineConfig } from 'vite';

// The script of the interactive parts (docs/59): one small file that prerender.ts puts inline.
export default defineConfig({
  build: {
    lib: { entry: 'src/client/main.ts', formats: ['iife'], name: 'landing', fileName: () => 'app.js' },
    outDir: '.client',
    emptyOutDir: true,
    target: 'es2022',
  },
});
