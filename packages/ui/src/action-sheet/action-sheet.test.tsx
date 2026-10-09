import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { tap } from '../market/market-test-kit';
import { renderInShell } from '../test-shell';
import type { ActionItem } from './action-item';
import { useActionItems } from './action-queue';
import { ActionSheet } from './action-sheet';

afterEach(cleanup);

const face = { id: 'p1', name: 'Madina', hasAvatar: false };
const item = (key: string, kind: ActionItem['kind'], title: string, plaque?: string): ActionItem => ({
  key,
  kind,
  face,
  badge: 'passengers',
  kicker: 'Yangi soʻrov',
  title,
  main: { label: `Ha: ${title}`, run: () => plaque },
  second: { label: 'Rad etish', run: () => undefined },
});

function Source({ items }: { readonly items: readonly ActionItem[] }) {
  useActionItems('test', items);
  return null;
}

const show = (items: readonly ActionItem[]) =>
  renderInShell(
    <>
      <Source items={items} />
      <ActionSheet />
    </>,
  );

// The sheet of the open Mini App (G68, docs/122, mockups g68/7, g68/8): one at a time in order.
describe('the action sheet (G68)', () => {
  it('shows one thing at a time in its order with «1 / 2»; «Keyinroq» brings the next', async () => {
    show([item('message:a', 'message', 'Jasur'), item('request:b', 'request', 'Madina · 2 joy')]);
    expect(await screen.findByText('Madina · 2 joy')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.queryByText('Jasur')).toBeNull();
    await tap('Keyinroq');
    expect(await screen.findByText('Jasur')).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
    await tap('Keyinroq');
    expect(screen.queryByText('Jasur')).toBeNull();
  });

  it('after an answer the sheet closes and a plaque on top says what happened', async () => {
    show([item('request:c', 'request', 'Aziz · 1 joy', 'Aziz tasdiqlandi · 10 000 komissiya')]);
    await tap('Ha: Aziz · 1 joy');
    expect(await screen.findByText('Aziz tasdiqlandi · 10 000 komissiya')).toBeTruthy();
    expect(screen.queryByText('Aziz · 1 joy')).toBeNull();
    expect(screen.queryByText(/\d+ \/ \d+/u)).toBeNull();
  });

  it('a failed answer keeps the sheet with the reason', async () => {
    const failing: ActionItem = {
      ...item('request:d', 'request', 'Olim · 1 joy'),
      main: {
        label: 'Tasdiqlash',
        run: () => Promise.reject(new Error('network')),
      },
    };
    show([failing]);
    await tap('Tasdiqlash');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Olim · 1 joy')).toBeTruthy();
  });
});
