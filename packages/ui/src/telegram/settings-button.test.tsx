import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OUTSIDE_TELEGRAM, TelegramContext } from './in-telegram-context';
import { useSettingsButton } from './settings-button';

const pressed = vi.hoisted(() => ({ listener: (): void => undefined }));
const sdk = vi.hoisted(() => ({
  settingsButton: {
    mount: { ifAvailable: vi.fn() },
    show: { ifAvailable: vi.fn() },
    hide: { ifAvailable: vi.fn() },
    onClick: {
      ifAvailable: vi.fn((listener: () => void) => {
        pressed.listener = listener;
        return [true, vi.fn()];
      }),
    },
  },
}));
vi.mock('@telegram-apps/sdk-react', () => sdk);

afterEach(cleanup);

function Screen({ onOpen }: { readonly onOpen: () => void }) {
  useSettingsButton(onOpen);
  return null;
}

describe('«Sozlamalar» in the ⋮ menu of Telegram (docs/88 L16)', () => {
  it('shows the native settings button and opens the profile with it', () => {
    const onOpen = vi.fn();
    const { unmount } = render(
      <TelegramContext.Provider value={{ ...OUTSIDE_TELEGRAM, inTelegram: true }}>
        <Screen onOpen={onOpen} />
      </TelegramContext.Provider>,
    );
    expect(sdk.settingsButton.show.ifAvailable).toHaveBeenCalled();
    pressed.listener();
    expect(onOpen).toHaveBeenCalledOnce();
    unmount();
    expect(sdk.settingsButton.hide.ifAvailable).toHaveBeenCalled();
  });
});
