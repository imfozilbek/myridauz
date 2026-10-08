import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { chooseRoute, recommendation, tap } from './market-test-kit';
import { openNewTrip, seatsLess } from './new-trip-test-kit';

const COMMENT = 'Yukxona boʻsh';
const RESTORED = 'Oldingi yozganingiz tiklandi.';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

// Route, the one screen with 3 seats, then the comment on its own screen.
async function toComment() {
  await chooseRoute();
  await screen.findByText('Mashinada 4 joy');
  seatsLess();
  await tap('Izoh (ixtiyoriy)');
  return screen.findByPlaceholderText('Izoh yozing');
}

describe('NewTripFlow keeps its answers (docs/94 F3, F8, B3)', { timeout: 20_000 }, () => {
  it('«Назад» from a screen of its own and from the trip shows each answer as it was', async () => {
    openNewTrip();
    fireEvent.change(await toComment(), { target: { value: COMMENT } });
    await tap('Orqaga');
    expect(await screen.findByText(COMMENT)).toBeTruthy();
    expect(screen.getByText('Siz bilan ketayotgan odam ayolmi?')).toBeTruthy();
    // The route was chosen here: «Назад» goes back to it with both ends, then on to the same trip.
    await tap('Orqaga');
    expect(await screen.findByText('Chilonzor')).toBeTruthy();
    expect(screen.getByText('Fargʻona shahri')).toBeTruthy();
    await tap('Davom etish');
    expect(await screen.findByText(COMMENT)).toBeTruthy();
  });

  it('a closed app opens the same screen with the typed comment; published, the draft is gone', async () => {
    openNewTrip();
    fireEvent.change(await toComment(), { target: { value: COMMENT } });
    cleanup();
    const { publishTrip } = openNewTrip();
    const comment = (await screen.findByPlaceholderText('Izoh yozing')) as HTMLTextAreaElement;
    expect(comment.value).toBe(COMMENT);
    expect(screen.getByText(RESTORED)).toBeTruthy();
    await tap('Davom etish');
    await tap('Eʼlon qilish');
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ comment: COMMENT, seats: 3 }));
    cleanup();
    openNewTrip();
    expect(await screen.findByText('Qayerdan')).toBeTruthy();
    expect(screen.queryByText(RESTORED)).toBeNull();
  });

  it('B3: waits for the price with a skeleton and «Назад», not a blank screen', async () => {
    let asked = 0;
    openNewTrip({
      recommend: () =>
        asked++ === 0 ? new Promise<never>(() => undefined) : Promise.resolve(recommendation),
    });
    await chooseRoute();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    await tap('Orqaga');
    expect(await screen.findByText('Chilonzor')).toBeTruthy();
  });
});
