import { defineConfig } from 'vite';

// The landing has no JavaScript in the browser: Vite bundles the prerender script, which writes
// plain HTML pages to dist (docs/59).
export default defineConfig({
  build: { ssr: 'src/prerender.ts', outDir: '.render', emptyOutDir: true, target: 'node22' },
  ssr: { noExternal: true },
});
