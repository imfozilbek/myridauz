import type { BookingsClient, MapClient } from '@platform/api-client';
import type { FoundPlace } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { tap } from '../market/market-test-kit';
import { fakeMap, openMap } from './map-test-kit';

afterEach(cleanup);

const CHORSU: FoundPlace = {
  name: 'Chorsu bozori',
  kind: 'market',
  area: 'Shayxontohur',
  point: { lat: 41.3265, lng: 69.2355 },
};
const type = (text: string) =>
  fireEvent.change(screen.getByPlaceholderText('Mahalla, koʻcha yoki moʻljal'), { target: { value: text } });

describe('the search of a place by name on the map (G23, docs/67)', () => {
  it('finds a place, moves the map to it and saves it with «Shu yerda»', async () => {
    const map = fakeMap();
    const search = vi.fn<MapClient['search']>(async () => [CHORSU]);
    const setPickup = vi.fn<BookingsClient['setPickup']>(async () => ({
      ...confirmed,
      pickup: CHORSU.point,
    }));
    await openMap(map, { search, setPickup });
    await screen.findByText('Uchrashuv joyingiz');
    type('Чорсу');
    expect(await screen.findByText('Bozor, doʻkon · Shayxontohur')).toBeTruthy();
    // Near the start of the trip first: the search gets the point the map opened at.
    expect(search).toHaveBeenCalledWith('Чорсу', confirmed.meetingPoint);
    await tap('Chorsu bozori');
    expect(map.at()).toEqual(CHORSU.point);
    expect(screen.queryByText('Bozor, doʻkon · Shayxontohur')).toBeNull();
    await tap('Shu yerda');
    expect(setPickup).toHaveBeenCalledWith(confirmed.id, CHORSU.point);
  });

  it('asks once when the person stops typing', async () => {
    const search = vi.fn<MapClient['search']>(async () => [CHORSU]);
    await openMap(fakeMap(), { search });
    await screen.findByText('Uchrashuv joyingiz');
    type('C');
    type('Ch');
    type('Cho');
    type('Chor');
    await screen.findByText('Chorsu bozori');
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('Chor', confirmed.meetingPoint);
  });

  it('says when nothing is found or the search failed, and advises to move the map', async () => {
    const search = vi
      .fn<MapClient['search']>()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('offline'));
    await openMap(fakeMap(), { search });
    await screen.findByText('Uchrashuv joyingiz');
    type('Qoraqamish');
    expect(await screen.findByText(/Hech narsa topilmadi.*xaritani surib/)).toBeTruthy();
    type('Qoraqamish 2');
    expect(await screen.findByText(/Qidirib boʻlmadi/)).toBeTruthy();
  });

  it('does not ask for one letter', async () => {
    const search = vi.fn<MapClient['search']>(async () => [CHORSU]);
    await openMap(fakeMap(), { search });
    await screen.findByText('Uchrashuv joyingiz');
    type('Q');
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(search).not.toHaveBeenCalled();
  });
});
