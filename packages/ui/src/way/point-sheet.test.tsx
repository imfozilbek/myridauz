import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { fakeMap, openPoint } from '../map/map-test-kit';

vi.mock('../telegram/location', () => ({ requestPosition: vi.fn(async () => null) }));

afterEach(() => {
  cleanup();
  localStorage.clear();
});
const place = (name: string, lat: number) => ({
  point: { lat, lng: 69.2 },
  name: { step: 'mahalla', name },
  district: '1726269',
});
const remember = (...names: string[]) =>
  localStorage.setItem('way_recent', JSON.stringify(names.map((name, i) => place(name, 41.2 + i / 100))));
const sheet = async () =>
  (await screen.findByText('Qayerdan olib ketsin?')).closest('.way-sheet') as HTMLElement;

describe('The point over the map with a sheet (G36, docs/100)', { timeout: 20_000 }, () => {
  it('keeps the pin, its name and «Mening joylashuvim» on the map, the rest in the sheet (DS1, DS4)', async () => {
    remember('Qatortol mahallasi');
    openPoint(fakeMap());
    const bottom = await sheet();
    expect(within(bottom).getByPlaceholderText('Mahalla, koʻcha yoki moʻljal')).toBeTruthy();
    expect(within(bottom).getByText('Qatortol mahallasi')).toBeTruthy();
    expect(bottom.contains(await screen.findByRole('status'))).toBe(false);
    expect(bottom.contains(screen.getByText('Mening joylashuvim'))).toBe(false);
  });

  it('takes a last place in one tap, without «Shu yerda» (DS3)', async () => {
    remember('Qatortol mahallasi');
    const { done } = openPoint(fakeMap());
    await tap('Qatortol mahallasi');
    await waitFor(() => expect(done).toHaveLength(1));
    expect(done[0]).toMatchObject({ place: { id: '1726269' }, point: { lat: 41.2 } });
  });

  it('shows two last places at most, each with its district (DS4, DS5)', async () => {
    remember('Birinchi', 'Ikkinchi', 'Uchinchi');
    openPoint(fakeMap());
    const bottom = await sheet();
    expect(within(bottom).queryByText('Uchinchi')).toBeNull();
    expect(within(bottom).getAllByText('Chilonzor')).toHaveLength(2);
  });

  it('closes the keyboard when a place is found, so the sheet goes down (DS4)', async () => {
    openPoint(fakeMap());
    const field = await screen.findByPlaceholderText('Mahalla, koʻcha yoki moʻljal');
    field.focus();
    fireEvent.change(field, { target: { value: 'Chorsu' } });
    await tap('Chorsu bozori');
    expect(document.activeElement).not.toBe(field);
  });
});
