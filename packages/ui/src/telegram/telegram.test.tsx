import { loadBrand } from '@platform/brands';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { BackButton } from './back-button';
import { MainButton, SecondaryButton } from './bottom-button';
import { confirm, haptic, protectFromClosing } from './feedback';
import { initTelegram } from './init-telegram';

const sdk = vi.hoisted(() => {
  const available = <T,>(result?: T) => ({ ifAvailable: vi.fn(() => [true, result] as const) });
  const button = () => ({
    mount: available(),
    setParams: available(),
    onClick: available(vi.fn()),
    show: available(),
    hide: available(),
  });
  return {
    isTMA: vi.fn(() => true),
    init: vi.fn(),
    miniApp: {
      mount: available(Promise.resolve()),
      setHeaderColor: available(),
      setBackgroundColor: available(),
      setBottomBarColor: available(),
      ready: available(),
    },
    viewport: { mount: available(Promise.resolve()), expand: available(), bindCssVars: available() },
    mainButton: button(),
    secondaryButton: button(),
    backButton: button(),
    closingBehavior: {
      mount: available(),
      enableConfirmation: available(),
      disableConfirmation: available(),
    },
    swipeBehavior: { mount: available(), disableVertical: available() },
    hapticFeedback: { impactOccurred: available(), notificationOccurred: available() },
    popup: { show: available(Promise.resolve('confirm')) },
  };
});
vi.mock('@telegram-apps/sdk-react', () => sdk);

const { colors } = loadBrand().theme;

beforeEach(() => vi.clearAllMocks());

describe('Telegram wrappers', () => {
  it('sets white Telegram colors and native behaviour', async () => {
    expect(initTelegram(colors)).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(sdk.miniApp.setHeaderColor.ifAvailable).toHaveBeenCalledWith(colors.bg);
    expect(sdk.miniApp.setBottomBarColor.ifAvailable).toHaveBeenCalledWith(colors.bg);
    expect(sdk.viewport.bindCssVars.ifAvailable).toHaveBeenCalled();
    expect(sdk.swipeBehavior.disableVertical.ifAvailable).toHaveBeenCalled();
    expect(sdk.miniApp.ready.ifAvailable).toHaveBeenCalled();
  });

  it('does nothing outside Telegram', () => {
    sdk.isTMA.mockReturnValueOnce(false);
    expect(initTelegram(colors)).toBe(false);
    expect(sdk.init).not.toHaveBeenCalled();
  });

  it('shows a turquoise native main button and hides it on leave', () => {
    const { unmount } = renderInShell(<MainButton text="Davom etish" onClick={() => undefined} />, true);
    expect(sdk.mainButton.setParams.ifAvailable).toHaveBeenCalledWith({
      text: 'Davom etish',
      isVisible: true,
      backgroundColor: colors.brandStrong,
      textColor: colors.bg,
    });
    unmount();
    expect(sdk.mainButton.setParams.ifAvailable).toHaveBeenLastCalledWith({ isVisible: false });
  });

  it('shows native secondary and back buttons', () => {
    const { unmount } = renderInShell(
      <>
        <SecondaryButton text="Orqaga" onClick={() => undefined} />
        <BackButton onClick={() => undefined} />
      </>,
      true,
    );
    expect(sdk.secondaryButton.setParams.ifAvailable).toHaveBeenCalledWith({
      text: 'Orqaga',
      isVisible: true,
    });
    expect(sdk.backButton.show.ifAvailable).toHaveBeenCalled();
    unmount();
    expect(sdk.backButton.hide.ifAvailable).toHaveBeenCalled();
  });

  it('falls back to page buttons outside Telegram', () => {
    const onClick = vi.fn();
    renderInShell(<SecondaryButton text="Keyinroq" onClick={onClick} />);
    fireEvent.click(screen.getByText('Keyinroq'));
    expect(onClick).toHaveBeenCalled();
  });

  it('asks in the native window, vibrates and protects from closing', async () => {
    await expect(confirm('Bekor qilasizmi?', 'Ha')).resolves.toBe(true);
    sdk.popup.show.ifAvailable.mockReturnValueOnce([false, undefined] as never);
    await expect(confirm('Bekor qilasizmi?', 'Ha')).resolves.toBe(false);
    haptic.tap();
    haptic.success();
    protectFromClosing(true);
    protectFromClosing(false);
    expect(sdk.hapticFeedback.impactOccurred.ifAvailable).toHaveBeenCalledWith('light');
    expect(sdk.closingBehavior.enableConfirmation.ifAvailable).toHaveBeenCalled();
    expect(sdk.closingBehavior.disableConfirmation.ifAvailable).toHaveBeenCalled();
  });
});
