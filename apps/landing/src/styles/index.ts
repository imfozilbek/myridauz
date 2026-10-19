import { fontStack, type BrandConfig } from '@platform/brands';
import { base } from './base';
import { interactive } from './interactive';
import { pages } from './pages';
import { sections } from './sections';

// Colors and the font come only from brands/<brand>/theme.ts (docs/20, docs/22, G73). Light theme only,
// phone first.
export function styles({ theme }: BrandConfig) {
  const { colors } = theme;
  const driver = { ...colors, ...theme.apps.driver };
  const tokens = `:root{--bg:${colors.bg};--grouped:${colors.bgGrouped};--brand:${colors.brand};
--strong:${colors.brandStrong};--brand-text:${colors.brandText};--soft:${colors.brandSoft};
--deep:${colors.brandDeep};--mint:${colors.brandMint};--accent:${colors.accent};--accent-text:${colors.accentText};
--driver:${driver.brandStrong};--driver-soft:${driver.brandSoft};--text:${colors.text};--muted:${colors.textMuted};
--danger:${colors.danger};--from:${colors.routeFrom};--to:${colors.routeTo};--font:${fontStack(theme.font)};
color-scheme:light}`;
  return tokens + base + sections + interactive + pages;
}
