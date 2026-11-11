import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { chooseRoute, tap } from './market-test-kit';
import { openNewTrip } from './new-trip-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const PITAK = toCyrillic('Qoʻyliq pitagi');
const DOORS = toCyrillic('Yoʻlovchilar uyidan: oʻzlari xaritada belgilaydi.');
const smallMap = () => document.querySelector('.meeting-map');
const chips = () => screen.getAllByRole('radio').map((chip) => chip.textContent);

// G63 (mockup g63/2, docs/70, docs/72): the way of pickup, the rule and the comment of a new trip.
describe('the parts of a new trip', { timeout: 20_000 }, () => {
  it('takes the pitak of the direction first, its card opens the map; the doors have a hint', async () => {
    openNewTrip();
    await chooseRoute();
    expect(await screen.findByText(PITAK)).toBeTruthy();
    expect(chips()).toEqual([toCyrillic('Pitakdan'), toCyrillic('Uydan'), toCyrillic('Ikkalasi')]);
    expect(screen.getByRole('radio', { name: toCyrillic('Pitakdan') }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByText(toCyrillic('Fargʻona yoʻnalishi pitagi'))).toBeTruthy();
    // The pitak is on the small map right under its card (docs/126, journey g63/4 screen 3).
    expect(smallMap()).toBeTruthy();
    await tap(toCyrillic('Uydan'));
    expect(screen.getByText(DOORS)).toBeTruthy();
    expect(screen.queryByText(PITAK)).toBeNull();
    expect(smallMap()).toBeNull();
    await tap(toCyrillic('Ikkalasi'));
    expect(smallMap()).toBeTruthy();
    await tap(toCyrillic('Xaritada'));
    // The pitak on the big map with a sheet (G75, mockup g75/6 A): this one, or the doors only.
    expect(document.querySelector('.pitak-map')).toBeTruthy();
    expect(screen.getByText(toCyrillic('Qayerdan olasiz?'))).toBeTruthy();
    expect(screen.getByText(PITAK)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Yoʻlovchilar shu pitakni koʻradi.'))).toBeTruthy();
    await tap(toCyrillic('Pitaksiz: faqat uyidan'));
    expect(await screen.findByText(toCyrillic('Eʼlon qilish'))).toBeTruthy();
    expect(screen.getByRole('radio', { name: toCyrillic('Uydan') }).getAttribute('aria-checked')).toBe(
      'true',
    );
    await tap(toCyrillic('Pitakdan'));
    // A tap on the small map opens the same big one.
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Xaritada ochish') }));
    expect(document.querySelector('.pitak-map')).toBeTruthy();
    await tap(toCyrillic('Shu pitakdan'));
    expect(await screen.findByText(toCyrillic('Eʼlon qilish'))).toBeTruthy();
    expect(screen.getByRole('radio', { name: toCyrillic('Pitakdan') }).getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('offers only the doors where the direction has no pitak', async () => {
    const { publishTrip } = openNewTrip({ pitak: false });
    await chooseRoute();
    expect(await screen.findByText(DOORS)).toBeTruthy();
    expect(chips()).toEqual([toCyrillic('Uydan')]);
    expect(smallMap()).toBeNull();
    await tap(toCyrillic('Eʼlon qilish'));
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ pickupMode: 'door' }));
  });

  it('opens the rule and the comment on their own screens and comes back with the answers', async () => {
    const { publishTrip } = openNewTrip();
    await chooseRoute();
    expect(await screen.findByText(/^Фақат жойлар · 380\s000$/u)).toBeTruthy();
    await tap(toCyrillic('Qanday band qilinadi?'));
    await tap(toCyrillic('Joylar yoki butun salon'));
    expect(await screen.findByText(/^Жойлар ёки бутун салон · 380\s000$/u)).toBeTruthy();
    await tap(toCyrillic('Izoh (ixtiyoriy)'));
    fireEvent.change(await screen.findByPlaceholderText(toCyrillic('Izoh yozing')), {
      target: { value: 'Yuk yoʻq' },
    });
    await tap(toCyrillic('Davom etish'));
    expect(await screen.findByText('Yuk yoʻq')).toBeTruthy();
    await tap(toCyrillic('Eʼlon qilish'));
    expect(publishTrip).toHaveBeenCalledWith(
      expect.objectContaining({ bookingRule: 'seats_or_car', comment: 'Yuk yoʻq' }),
    );
  });
});
