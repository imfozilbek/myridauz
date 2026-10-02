import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { addAppToHomeScreen, useCanAddToHomeScreen } from './home-screen';

const sdk = vi.hoisted(() => ({
  checkHomeScreenStatus: { ifAvailable: vi.fn(() => [true, Promise.resolve('missed')]) },
  addToHomeScreen: { ifAvailable: vi.fn() },
}));
vi.mock('@telegram-apps/sdk-react', () => sdk);

describe('the app on the phone screen (docs/88 L17)', () => {
  it('is offered only when Telegram can add it and it is not there', async () => {
    const { result } = renderHook(() => useCanAddToHomeScreen());
    await waitFor(() => expect(result.current).toBe(true));
    sdk.checkHomeScreenStatus.ifAvailable.mockReturnValueOnce([true, Promise.resolve('added')]);
    const again = renderHook(() => useCanAddToHomeScreen());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(again.result.current).toBe(false);
    addAppToHomeScreen();
    expect(sdk.addToHomeScreen.ifAvailable).toHaveBeenCalledOnce();
  });
});
