import { loadBrand } from '@platform/brands';
import type { DriverApplication } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockedScreen } from '../account/blocked-screen';
import { StatusScreen } from '../driver/status-screen';
import { renderInShell } from '../test-shell';
import { ErrorScreen } from './error-screen';

afterEach(cleanup);

const { colors } = loadBrand().theme;
const tileOf = (title: string) =>
  screen.getByText(title).parentElement?.querySelector<HTMLElement>('.empty-state-tile');
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).join(', ')})`;

// The state screens of the mockup g75/1 A (G75): the tile in the middle, the title, the words, one button.
describe('the state screens', () => {
  it('says until when a block lasts, then whom to ask, on a red tile', () => {
    renderInShell(<BlockedScreen until={Date.parse('2026-10-14T07:00:00Z')} />);
    expect(screen.getByText('Blok 14-oktabr kuni tugaydi.')).toBeTruthy();
    expect(screen.getByText('Savollar boʻlsa, qoʻllab-quvvatlash xizmatiga yozing.')).toBeTruthy();
    expect(tileOf('Hisobingiz bloklangan')?.style.background).toBe(rgb(colors.dangerTile));
  });

  it('shows an error and a refused application on a red tile with one button', () => {
    const retry = vi.fn();
    renderInShell(<ErrorScreen onRetry={retry} />);
    expect(tileOf('Xatolik yuz berdi')?.style.background).toBe(rgb(colors.dangerTile));
    screen.getByText('Qayta urinish').click();
    expect(retry).toHaveBeenCalled();
    cleanup();
    const application: DriverApplication = {
      status: 'rejected',
      car: null,
      photos: { front: true, side: true, interior: true },
      reasons: ['fake_profile'],
    };
    renderInShell(<StatusScreen application={application} />);
    expect(screen.getByText('Qoʻllab-quvvatlashga yozish')).toBeTruthy();
    const tile = document.querySelector<HTMLElement>('.empty-state-tile');
    expect(tile?.style.background).toBe(rgb(colors.dangerTile));
  });
});
