import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StartFlow } from '../flow/start-flow';
import { renderInShell } from '../test-shell';
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
vi.mock('@telegram-apps/sdk-react', async (original) => ({ ...(await original<object>()), ...sdk }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const ACTIONS = [
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.passenger.myTripsHint',
    Screen: () => null,
  },
] as const;

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

  it('F4: is only on the main screen, a section has none (owner decision 02.10.2026, docs/94)', () => {
    renderInShell(<StartFlow actions={ACTIONS} />, true);
    expect(sdk.settingsButton.show.ifAvailable).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Mening safarlarim'));
    expect(sdk.settingsButton.hide.ifAvailable).toHaveBeenCalledOnce();
    expect(sdk.settingsButton.show.ifAvailable).toHaveBeenCalledOnce();
  });
});
