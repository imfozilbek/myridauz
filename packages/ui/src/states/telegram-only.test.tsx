import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { OUTSIDE_TELEGRAM, TelegramContext } from '../telegram/in-telegram-context';
import { TelegramOnly } from './telegram-only';

const inTelegram = (initData: string) => ({ ...OUTSIDE_TELEGRAM, inTelegram: true, initData });
afterEach(cleanup);

describe('TelegramOnly (G52, docs/112)', () => {
  it('asks to open the Mini App in Telegram instead of failing every call outside it', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderInShell(
      <TelegramOnly app="driver" required>
        <p>ilova</p>
      </TelegramOnly>,
    );
    expect(screen.queryByText('ilova')).toBeNull();
    expect(screen.getByText('Telegramda oching')).toBeTruthy();
    fireEvent.click(screen.getByText('Telegramda ochish'));
    expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${loadBrand().bots.driver}?startapp`);
  });

  it('lets the app in inside Telegram with a signed launch and in a local run', () => {
    renderInShell(
      <TelegramContext.Provider value={inTelegram('user=1&hash=x')}>
        <TelegramOnly app="passenger" required>
          <p>ilova</p>
        </TelegramOnly>
      </TelegramContext.Provider>,
    );
    expect(screen.getByText('ilova')).toBeTruthy();
  });

  it('asks the same inside Telegram without a signed launch: every call would fail (auth.missing)', () => {
    renderInShell(
      <TelegramContext.Provider value={inTelegram('')}>
        <TelegramOnly app="passenger" required>
          <p>ilova</p>
        </TelegramOnly>
      </TelegramContext.Provider>,
    );
    expect(screen.queryByText('ilova')).toBeNull();
    expect(screen.getByText('Telegramda oching')).toBeTruthy();
  });
});
