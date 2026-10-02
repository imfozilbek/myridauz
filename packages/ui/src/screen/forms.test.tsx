import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { clearDraft, useDraft, writeDraft } from './draft';
import { useUnsavedGuard } from './unsaved-guard';

const sdk = vi.hoisted(() => ({
  closingBehavior: {
    enableConfirmation: { ifAvailable: vi.fn() },
    disableConfirmation: { ifAvailable: vi.fn() },
  },
}));
vi.mock('@telegram-apps/sdk-react', async (actual) => ({
  ...(await actual<typeof import('@telegram-apps/sdk-react')>()),
  closingBehavior: sdk.closingBehavior,
}));
const asked = vi.spyOn(window, 'confirm');
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

function Form({ onBack }: { readonly onBack: () => void }) {
  const [text, setText] = useState('');
  const guard = useUnsavedGuard(text.length > 0);
  return (
    <>
      <input aria-label="text" value={text} onChange={(event) => setText(event.target.value)} />
      <button onClick={guard(onBack)}>back</button>
    </>
  );
}

describe('a form keeps what the person typed (docs/94 F3)', () => {
  it('untouched: «Назад» leaves at once and Telegram never asks', () => {
    const onBack = vi.fn();
    renderInShell(<Form onBack={onBack} />);
    fireEvent.click(screen.getByText('back'));
    expect(onBack).toHaveBeenCalledOnce();
    expect(asked).not.toHaveBeenCalled();
    expect(sdk.closingBehavior.enableConfirmation.ifAvailable).not.toHaveBeenCalled();
  });

  it('typed: Telegram asks before closing, «Назад» asks and stays on «no»', async () => {
    const onBack = vi.fn();
    asked.mockReturnValueOnce(false).mockReturnValueOnce(true);
    const { unmount } = renderInShell(<Form onBack={onBack} />);
    fireEvent.change(screen.getByLabelText('text'), { target: { value: 'Salom' } });
    expect(sdk.closingBehavior.enableConfirmation.ifAvailable).toHaveBeenCalledOnce();
    await act(async () => fireEvent.click(screen.getByText('back')));
    expect(asked).toHaveBeenCalledWith('Oʻzgarishlar saqlanmaydi. Chiqasizmi?');
    expect(onBack).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByText('back')));
    expect(onBack).toHaveBeenCalledOnce();
    unmount();
    expect(sdk.closingBehavior.disableConfirmation.ifAvailable).toHaveBeenCalledOnce();
  });

  it('a draft comes back within 24 hours, checked; older, broken or sent, it is gone', () => {
    const check = (value: unknown) => (typeof value === 'string' ? value : null);
    function Draft() {
      const { restored } = useDraft('trip', check);
      return <p>{restored ?? 'empty'}</p>;
    }
    writeDraft('trip', 'Yukxona boʻsh');
    const fresh = renderInShell(<Draft />);
    expect(screen.getByText('Yukxona boʻsh')).toBeTruthy();
    fresh.unmount();
    writeDraft('trip', 'Eski', Date.now() - 25 * 60 * 60 * 1000);
    const old = renderInShell(<Draft />);
    expect(screen.getByText('empty')).toBeTruthy();
    old.unmount();
    writeDraft('trip', 42);
    const strange = renderInShell(<Draft />);
    expect(screen.getByText('empty')).toBeTruthy();
    strange.unmount();
    writeDraft('trip', 'Yuborildi');
    clearDraft('trip');
    renderInShell(<Draft />);
    expect(screen.getByText('empty')).toBeTruthy();
  });
});
