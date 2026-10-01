import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { offer } from './booking-test-kit';
import { OffersSection } from './offers-section';

afterEach(cleanup);

describe('drivers offers on the own request (docs/86 V5)', () => {
  it('says what to do with an offer and shows each row opens', () => {
    const onOpen = vi.fn();
    const { container } = renderInShell(<OffersSection offers={[offer]} onOpen={onOpen} />, true);
    expect(screen.getByText('Taklifni oching va qabul qiling')).toBeTruthy();
    // On iOS a row that opens a screen ends with a chevron, like Telegram (docs/21).
    expect(container.querySelector('.cell-after svg')).not.toBeNull();
    fireEvent.click(screen.getByText('Jasur'));
    expect(onOpen).toHaveBeenCalledWith(offer);
  });
});
