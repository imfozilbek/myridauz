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
  it('keeps the search on top and «Joylashuvim» on the map, the name and the places in the sheet (docs/126)', async () => {
    remember('Qatortol mahallasi');
    openPoint(fakeMap());
    const bottom = await sheet();
    expect(bottom.contains(screen.getByPlaceholderText('Joy nomini yozing'))).toBe(false);
    expect(within(bottom).getByText('Qatortol mahallasi')).toBeTruthy();
    expect(bottom.contains(await screen.findByRole('status'))).toBe(true);
    expect(bottom.contains(screen.getByText('Joylashuvim'))).toBe(false);
  });

  it('takes a last place in one tap, without «Shu yerda» (DS3)', async () => {
    remember('Qatortol mahallasi');
    const { done } = openPoint(fakeMap());
    await tap('Qatortol mahallasi');
    await waitFor(() => expect(done).toHaveLength(1));
    expect(done[0]).toMatchObject({ place: { id: '1726269' }, point: { lat: 41.2 } });
  });

  it('shows two last places at most as chips with their names (DS4, mockup screen 9)', async () => {
    remember('Birinchi', 'Ikkinchi', 'Uchinchi');
    openPoint(fakeMap());
    const bottom = await sheet();
    expect(within(bottom).queryByText('Uchinchi')).toBeNull();
    expect(within(bottom).getByRole('button', { name: 'Birinchi' })).toBeTruthy();
    expect(within(bottom).getByRole('button', { name: 'Ikkinchi' })).toBeTruthy();
  });

  it('closes the keyboard when a place is found, so the sheet goes down (DS4)', async () => {
    openPoint(fakeMap());
    const field = await screen.findByPlaceholderText('Joy nomini yozing');
    field.focus();
    fireEvent.change(field, { target: { value: 'Chorsu' } });
    await tap('Chorsu bozori');
    expect(document.activeElement).not.toBe(field);
  });
});
