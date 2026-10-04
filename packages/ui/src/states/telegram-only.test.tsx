import { loadBrand } from '@platform/brands';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { TelegramOnly } from './telegram-only';

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

  it('lets the app in inside Telegram and in a local run', () => {
    renderInShell(
      <TelegramOnly app="passenger" required>
        <p>ilova</p>
      </TelegramOnly>,
      true,
    );
    expect(screen.getByText('ilova')).toBeTruthy();
  });
});
