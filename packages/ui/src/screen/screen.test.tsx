import { act, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { forgetList, keepValue, keptValue, useListPlace } from './list-memory';
import { Screen } from './screen';

const scrollTo = vi.spyOn(window, 'scrollTo');
afterEach(() => vi.clearAllMocks());
const at = (y: number) => Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
const touch = (type: string, clientY: number) =>
  fireEvent(window, Object.assign(new Event(type), { touches: [{ clientY }] }));

function List({ ready: start }: { readonly ready: boolean }) {
  const [ready, setReady] = useState(start);
  useListPlace('trips:1', ready);
  return (
    <>
      <Screen onBack={() => undefined} />
      <button onClick={() => setReady(true)}>rows</button>
    </>
  );
}

describe('Screen (docs/94)', () => {
  it('F1: every screen opens at the top', () => {
    at(640);
    renderInShell(<Screen onBack={() => undefined} />);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it('leaves without an error where scrollTo gives a Promise (Chrome 153+, lesson 132)', () => {
    scrollTo.mockImplementationOnce((() => Promise.resolve()) as unknown as typeof window.scrollTo);
    const shown = renderInShell(<Screen />);
    expect(() => shown.unmount()).not.toThrow();
  });

  it('F2: a list comes back to its place once its rows are there, then a visit from above starts fresh', () => {
    at(0);
    const first = renderInShell(<List ready />);
    at(900);
    first.unmount();
    const back = renderInShell(<List ready={false} />);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
    fireEvent.click(screen.getByText('rows'));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 900);
    back.unmount();
    keepValue('trips:1:data', [1, 2]);
    forgetList('trips:1');
    expect(keptValue('trips:1:data')).toBeUndefined();
    scrollTo.mockClear();
    renderInShell(<List ready />);
    expect(scrollTo).not.toHaveBeenCalledWith(0, 900);
  });

  it('W1: a pull down at the top refreshes the list; a short pull does nothing', async () => {
    at(0);
    const onRefresh = vi.fn(async () => undefined);
    renderInShell(<Screen onRefresh={onRefresh} />);
    touch('touchstart', 100);
    touch('touchmove', 140);
    touch('touchend', 140);
    expect(onRefresh).not.toHaveBeenCalled();
    touch('touchstart', 100);
    touch('touchmove', 300);
    expect(document.querySelector('.pull-refresh')).not.toBeNull();
    await act(async () => touch('touchend', 300));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
