import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBrand } from '@platform/brands';
import { renderSite } from './site';

// Build step (docs/59): writes the pages of the brand to apps/landing/dist and copies its
// icons and link preview from brands/<brand>/landing.
const brand = loadBrand(process.env['VITE_BRAND']);
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
rmSync(dist, { recursive: true, force: true });
for (const [file, html] of Object.entries(renderSite(brand, new Date().getFullYear()))) {
  const path = `${dist}${file}`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
}
cpSync(fileURLToPath(new URL(`../../../brands/${brand.id}/landing/`, import.meta.url)), dist, {
  recursive: true,
});
console.log(`landing: ${brand.id} written to ${dist}`);
