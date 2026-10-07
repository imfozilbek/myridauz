import { loadBrand } from '@platform/brands';
import { describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { useScreenBackground } from './screen-background';

const sdk = vi.hoisted(() => {
  const available = () => ({ ifAvailable: vi.fn(() => [true, undefined] as const) });
  return {
    miniApp: { setHeaderColor: available(), setBackgroundColor: available(), setBottomBarColor: available() },
  };
});
vi.mock('@telegram-apps/sdk-react', async (original) => ({ ...(await original()), ...sdk }));

const { colors } = loadBrand().theme;
// The brand color at 9% on white, as docs/121 §5 writes it: computed here from the token.
const TOP = `#${[1, 3, 5]
  .map((at) => Math.round(0.09 * parseInt(colors.brandStrong.slice(at, at + 2), 16) + 0.91 * 255))
  .map((channel) => channel.toString(16).padStart(2, '0'))
  .join('')
  .toUpperCase()}`;
const Tinted = () => {
  useScreenBackground('tinted');
  return null;
};

// The registration: the light color of the app on top, the grouped gray from the middle (docs/121 §5).
describe('useScreenBackground tinted (G58)', () => {
  it('mixes the passenger color only with white and paints the Telegram header with the top', () => {
    renderInShell(<Tinted />, true);
    expect(sdk.miniApp.setHeaderColor.ifAvailable).toHaveBeenCalledWith(TOP);
    expect(sdk.miniApp.setBottomBarColor.ifAvailable).toHaveBeenCalledWith(colors.bgGrouped);
    expect(document.body.style.background).toContain('linear-gradient');
    expect(document.body.style.background).toContain('55vh');
  });
});
