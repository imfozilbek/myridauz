// Shared Vite setup for all Mini Apps.
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { brandForApp, fontHead, loadBrand } from '../../brands/index.ts';
import { splashHtml } from '../ui/src/splash/splash-html.ts';

const read = (url) => readFileSync(url, 'utf8');

// The splash of docs/121 §4 goes into index.html at the build: the brand of the Mini App, no script.
function splash(brand) {
  const logo = read(new URL(`../../brands/${brand.id}/public/logo.svg`, import.meta.url));
  const { head, body } = splashHtml(
    brand,
    logo,
    read(new URL('../ui/src/splash/splash.css', import.meta.url)),
  );
  return {
    name: 'splash',
    transformIndexHtml: (html) =>
      html.replace('</head>', `${head}</head>`).replace('<body>', `<body>${body}`),
  };
}

// The font of the brand (G73): its faces and its Latin files in the head, so the first frame has it.
function font(brand) {
  const name = brand.theme.font;
  const faces = read(new URL(`../../brands/${brand.id}/public/fonts/${name}/font.css`, import.meta.url));
  return {
    name: 'font',
    transformIndexHtml: (html) => html.replace('</head>', `${fontHead(name, faces.trim())}</head>`),
  };
}

// Static files of the brand (region photos, docs/48) come from brands/<brand>/public; the splash
// shows the name of the environment of the build (docs/179).
export default function miniApp(app) {
  const brand = brandForApp(loadBrand(process.env.VITE_BRAND, process.env.VITE_ENVIRONMENT), app);
  const publicDir = fileURLToPath(new URL(`../../brands/${brand.id}/public`, import.meta.url));
  return defineConfig({ plugins: [react(), font(brand), splash(brand)], publicDir });
}
