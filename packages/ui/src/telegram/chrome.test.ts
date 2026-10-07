import { brandForApp, loadBrand } from '@platform/brands';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paintMounted, paintScreen, paintSplash } from './chrome';

const sdk = vi.hoisted(() => {
  const setter = () => ({ ifAvailable: vi.fn() });
  return { miniApp: { setHeaderColor: setter(), setBackgroundColor: setter(), setBottomBarColor: setter() } };
});
vi.mock('@telegram-apps/sdk-react', () => sdk);

const header = () => sdk.miniApp.setHeaderColor.ifAvailable.mock.lastCall?.[0];
const bottomBar = () => sdk.miniApp.setBottomBarColor.ifAvailable.mock.lastCall?.[0];
beforeEach(() => vi.clearAllMocks());
const {
  brandStrong: app,
  brandSoft: top,
  bgGrouped: bottom,
  bg: white,
} = brandForApp(loadBrand(), 'passenger').theme.colors;

// The Telegram header and bottom bar in the color of the splash while it stands (docs/121 §4, G72).
describe('Telegram colors under the splash', () => {
  it('holds the color of the splash and gives the screen its colors back when it leaves', () => {
    paintSplash(app);
    paintScreen({ header: top, bottom: bottom });
    expect([header(), bottomBar()]).toEqual([app, app]);
    paintSplash(undefined);
    expect([header(), bottomBar()]).toEqual([top, bottom]);
  });

  it('paints the asked colors once Telegram has mounted the app, white only if none were asked', () => {
    paintMounted({ header: white, bottom: white });
    expect(header()).toBe(top);
  });
});
