import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { sheetClosed } from '../home/sheet-closed';
import { tap } from '../market/market-test-kit';
import { renderInShell } from '../test-shell';
import type { ActionItem } from './action-item';
import { openSheet, useActionItems } from './action-queue';
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

const open = (kind: ActionItem['kind']) => act(() => openSheet(kind));

// The sheet of the open Mini App (G68, G76, docs/164): only a call rises by itself; the rest open
// from the block at the bottom, one at a time, «1 / 2» while more of the kind wait.
describe('the action sheet (G68, G76)', () => {
  it('never rises by itself for a request or a message; a call does', async () => {
    show([item('message:a', 'message', 'Jasur'), item('request:b', 'request', 'Madina · 2 joy')]);
    await act(() => Promise.resolve());
    expect(screen.queryByText('Madina · 2 joy')).toBeNull();
    cleanup();
    show([item('call:c', 'call', 'Akmal')]);
    expect(await screen.findByText('Akmal')).toBeTruthy();
  });

  it('opens one kind, «1 / 2», an answer brings the next; «Keyinroq» closes it', async () => {
    show([
      item('message:a', 'message', 'Jasur'),
      item('request:b', 'request', 'Madina · 2 joy'),
      item('request:e', 'request', 'Olim · 1 joy'),
    ]);
    await open('request');
    expect(await screen.findByText('Madina · 2 joy')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.queryByText('Jasur')).toBeNull();
    await tap('Ha: Madina · 2 joy');
    expect(await screen.findByText('Olim · 1 joy')).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
    await tap('Keyinroq');
    await sheetClosed();
    expect(screen.queryByText('Olim · 1 joy')).toBeNull();
  });

  it('after an answer the sheet closes and a plaque on top says what happened', async () => {
    show([item('request:c', 'request', 'Aziz · 1 joy', 'Aziz tasdiqlandi · 10 000 komissiya')]);
    await open('request');
    await tap('Ha: Aziz · 1 joy');
    expect(await screen.findByText('Aziz tasdiqlandi · 10 000 komissiya')).toBeTruthy();
    expect(screen.queryByText('Aziz · 1 joy')).toBeNull();
    expect(screen.queryByText(/\d+ \/ \d+/u)).toBeNull();
    await sheetClosed();
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
    await open('request');
    await tap('Tasdiqlash');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Olim · 1 joy')).toBeTruthy();
  });
});
