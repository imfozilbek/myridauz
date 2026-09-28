import { loadBrand } from '@platform/brands';
import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './app-shell';
import { signalTelegramReady } from './telegram';

const ROOT_ID = 'root';

export function mountApp(Page: ComponentType): void {
  const container = document.getElementById(ROOT_ID);
  if (!container) throw new Error('ui.root_missing');
  const brand = loadBrand(import.meta.env.VITE_BRAND);
  document.title = brand.name;
  createRoot(container).render(
    <StrictMode>
      <AppShell brand={brand}>
        <Page />
      </AppShell>
    </StrictMode>,
  );
  signalTelegramReady();
}
