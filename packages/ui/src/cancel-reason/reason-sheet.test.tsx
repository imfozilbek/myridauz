import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../test-shell';
import { askReason } from './ask-reason';

afterEach(cleanup);

// G87 V3 (docs/191): «Nima uchun?» after a cancel or a deletion, one tap or skipped, numbers only.
describe('the reason of a cancel', () => {
  it('counts the tapped reason with what went, then lets the step go on', async () => {
    const { tracked } = renderInShell(null);
    let answered = false;
    act(() => void askReason('booking').then(() => (answered = true)));
    expect(await screen.findByText('Nima uchun?')).toBeTruthy();
    expect(screen.getByText('Bir marta bosing. Javob bermasangiz ham boʻladi.')).toBeTruthy();
    expect(screen.getByText('Boshqa mashina topdim')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Rejam oʻzgardi')));
    expect(answered).toBe(true);
    expect(tracked.filter((event) => event.name === 'cancel_reason')).toEqual([
      { name: 'cancel_reason', screen: 'cancel.booking', what: 'booking', reason: 'plans' },
    ]);
    expect(screen.queryByText('Nima uchun?')).toBeNull();
  });

  it('lets a person skip it: nothing is counted', async () => {
    const { tracked } = renderInShell(null);
    let answered = false;
    act(() => void askReason('account').then(() => (answered = true)));
    expect(await screen.findByText('Ilova tushunarsiz')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Oʻtkazib yuborish')));
    expect(answered).toBe(true);
    expect(tracked.filter((event) => event.name === 'cancel_reason')).toEqual([]);
  });
});
