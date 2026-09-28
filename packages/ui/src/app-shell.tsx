import '@telegram-apps/telegram-ui/dist/styles.css';
import type { BrandConfig } from '@platform/brands';
import { AppRoot } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { BrandContext } from './brand-context';

type AppShellProps = {
  readonly brand: BrandConfig;
  readonly children: ReactNode;
};

// Light theme only, never dark (docs/20).
export function AppShell({ brand, children }: AppShellProps) {
  return (
    <BrandContext.Provider value={brand}>
      <AppRoot appearance="light">{children}</AppRoot>
    </BrandContext.Provider>
  );
}
