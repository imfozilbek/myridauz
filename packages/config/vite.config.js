// Shared Vite setup for all Mini Apps.
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { loadBrand } from '../../brands/index.ts';

// Static files of the brand (region photos, docs/48) come from brands/<brand>/public.
const brand = loadBrand(process.env.VITE_BRAND);
const publicDir = fileURLToPath(new URL(`../../brands/${brand.id}/public`, import.meta.url));

export default defineConfig({ plugins: [react()], publicDir });
