import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfferAccepted } from '../bookings/offer-list';
import { renderInShell } from '../test-shell';
import { HomeProvider } from './home-context';

afterEach(cleanup);

// G38 (owner decision 03.10.2026, docs/103): after a finished action «Назад» and «Tayyor» lead to
// the main screen, never back into the steps of the wizard.
describe('a finished action', () => {
  it('goes to the main screen when the app has one', () => {
    const home = vi.fn();
    const onDone = vi.fn();
    renderInShell(
      <HomeProvider value={home}>
        <OfferAccepted bookingId={null} onDone={onDone} />
      </HomeProvider>,
    );
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(screen.getByText('Tayyor'));
    expect(home).toHaveBeenCalledTimes(2);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('keeps its own way back outside the main screen', () => {
    const onDone = vi.fn();
    renderInShell(<OfferAccepted bookingId={null} onDone={onDone} />);
    fireEvent.click(screen.getByText('Tayyor'));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
