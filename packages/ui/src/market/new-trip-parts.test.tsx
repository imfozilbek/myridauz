import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { chooseRoute, tap } from './market-test-kit';
import { openNewTrip } from './new-trip-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const PITAK = 'Qoʻyliq pitagi';
const DOORS = 'Yoʻlovchilar uyidan: oʻzlari xaritada belgilaydi.';
const chips = () => screen.getAllByRole('radio').map((chip) => chip.textContent);

// G63 (mockup g63/2, docs/70, docs/72): the way of pickup, the rule and the comment of a new trip.
describe('the parts of a new trip', { timeout: 20_000 }, () => {
  it('takes the pitak of the direction first, its card opens the map; the doors have a hint', async () => {
    openNewTrip();
    await chooseRoute();
    expect(await screen.findByText(PITAK)).toBeTruthy();
    expect(chips()).toEqual(['Pitakdan', 'Uydan', 'Ikkalasi']);
    expect(screen.getByRole('radio', { name: 'Pitakdan' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Fargʻona yoʻnalishi pitagi')).toBeTruthy();
    await tap('Uydan');
    expect(screen.getByText(DOORS)).toBeTruthy();
    expect(screen.queryByText(PITAK)).toBeNull();
    await tap('Ikkalasi');
    await tap('Xaritada');
    expect(document.querySelector('.pitak-map')).toBeTruthy();
    expect(screen.getByText(PITAK)).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('Eʼlon qilish')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Ikkalasi' }).getAttribute('aria-checked')).toBe('true');
  });

  it('offers only the doors where the direction has no pitak', async () => {
    const { publishTrip } = openNewTrip({ pitak: false });
    await chooseRoute();
    expect(await screen.findByText(DOORS)).toBeTruthy();
    expect(chips()).toEqual(['Uydan']);
    await tap('Eʼlon qilish');
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ pickupMode: 'door' }));
  });

  it('opens the rule and the comment on their own screens and comes back with the answers', async () => {
    const { publishTrip } = openNewTrip();
    await chooseRoute();
    expect(await screen.findByText(/^Faqat joylar · 380\s000$/u)).toBeTruthy();
    await tap('Qanday band qilinadi?');
    await tap('Joylar yoki butun salon');
    await tap('Davom etish');
    expect(await screen.findByText(/^Joylar yoki butun salon · 380\s000$/u)).toBeTruthy();
    await tap('Izoh (ixtiyoriy)');
    fireEvent.change(await screen.findByPlaceholderText('Izoh yozing'), { target: { value: 'Yuk yoʻq' } });
    await tap('Davom etish');
    expect(await screen.findByText('Yuk yoʻq')).toBeTruthy();
    await tap('Eʼlon qilish');
    expect(publishTrip).toHaveBeenCalledWith(
      expect.objectContaining({ bookingRule: 'seats_or_car', comment: 'Yuk yoʻq' }),
    );
  });
});
