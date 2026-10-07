import { loadBrand } from '@platform/brands';
import { act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { native } from '../test-native';
import { renderInShell } from '../test-shell';
import { MainButton } from './bottom-button';
import { paintSplash } from './chrome';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
afterEach(() => paintSplash(undefined));

// The splash has no button (docs/121 §4): the first screen gets ready under it, its Telegram button
// waits until the splash leaves (G72, the owner's phone check 07.10.2026).
describe('the main button under the splash (G72)', () => {
  it('stays hidden while the splash stands and shows when it leaves', () => {
    paintSplash(loadBrand().theme.colors.brandStrong);
    renderInShell(<MainButton text="Safar topish" onClick={() => undefined} />, true);
    expect(native.mainShown).toBe(false);
    act(() => paintSplash(undefined));
    expect(native.mainShown).toBe(true);
  });
});
