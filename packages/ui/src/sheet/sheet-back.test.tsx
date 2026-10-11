import { act, cleanup, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openSheet, useActionItems } from '../action-sheet/action-queue';
import type { ActionItem } from '../action-sheet/action-item';
import { ActionSheet } from '../action-sheet/action-sheet';
import { OtherCarSheet } from '../driver/car-form/other-car-sheet';
import { BoardSheet } from '../requests/board-sheet';
import { BackButton } from '../telegram/back-button';
import { pressBack } from '../test-native';
import { renderInShell } from '../test-shell';
import { FormSheet } from './form-sheet';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
afterEach(cleanup);

type Sheet = (open: boolean, onClose: () => void) => ReactNode;

// A screen with its own «Назад» and a sheet over it, both in Telegram.
function Screen({ sheet, left }: { readonly sheet: Sheet; readonly left: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <BackButton onClick={left} />
      <p>{open ? 'sheet open' : 'sheet closed'}</p>
      {sheet(open, () => setOpen(false))}
    </>
  );
}

const SHEETS: Record<string, Sheet> = {
  'the form sheet': (open, onClose) => (
    <FormSheet open={open} title="Izoh" onClose={onClose}>
      <p>form</p>
    </FormSheet>
  ),
  'a sheet of the requests board': (open, onClose) => (
    <BoardSheet open={open} kind="offer" onClose={onClose}>
      <p>offer</p>
    </BoardSheet>
  ),
  '«Boshqa ›» of the car': (open, onClose) => (
    <OtherCarSheet open={open} onClose={onClose} onPick={() => undefined} />
  ),
};

// The native «Назад» of Telegram with a sheet open closes the sheet, never the screen under it or
// the Mini App (G77, docs/168 B); the next «Назад» is the screen's again.
describe('«Назад» of Telegram over a sheet', () => {
  for (const [name, sheet] of Object.entries(SHEETS))
    it(`closes ${name} first`, () => {
      const left = vi.fn();
      renderInShell(<Screen sheet={sheet} left={left} />, true);
      act(pressBack);
      expect(screen.getByText('sheet closed')).toBeTruthy();
      expect(left).not.toHaveBeenCalled();
      act(pressBack);
      expect(left).toHaveBeenCalledOnce();
    });

  it('closes the action sheet first; the thing still waits in the block', async () => {
    const left = vi.fn();
    const item: ActionItem = {
      key: 'request:b',
      kind: 'request',
      face: { id: 'p1', name: 'Madina', hasAvatar: false },
      kicker: 'Yangi soʻrov',
      title: 'Madina · 2 joy',
      main: { label: 'Qabul qilish', run: () => undefined },
    };
    function Source() {
      useActionItems('test', [item]);
      return <BackButton onClick={left} />;
    }
    renderInShell(
      <>
        <Source />
        <ActionSheet />
      </>,
      true,
    );
    act(() => openSheet('request'));
    expect(await screen.findByText('Madina · 2 joy')).toBeTruthy();
    act(pressBack);
    expect(screen.queryByText('Madina · 2 joy')).toBeNull();
    expect(left).not.toHaveBeenCalled();
    act(() => openSheet('request'));
    expect(await screen.findByText('Madina · 2 joy')).toBeTruthy();
  });
});
