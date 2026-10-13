import { channelOf, loadBrand } from '@platform/brands';
import type { HistoryItem } from '@platform/contracts';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { approved, NOW, renderProfile } from '../account/profile/profile-test-kit';
import { request } from '../bookings/booking-test-kit';
import { trip } from '../market/market-test-kit';
import type { Overrides } from '../test-clients-other';

// «Kanallar» of a person (docs/119, mockups 7-channels-2 and 7-channels-3): the channels of the
// directions that are made, «Siz uchun» with the reason, «Qoʻshilish» or «✓ Aʼzosiz». The own
// channels of the last search, of the trips to Samarqand, of the request to Fargʻona and of Qoʻqon.
const brand = loadBrand();
const [andijon, samarqand, fargona, qoqon] = ['1703202', '1718401', '1730401', '1730405'].map((place) =>
  channelOf(brand, place),
);
// The server made the link «Rida ilovasi» of Qoʻqon, not yet of the others (docs/176).
const APP_LINK = 'https://t.me/+app_qoqon';
const made = [andijon, samarqand, fargona, qoqon].map((zone) => ({
  chat: zone?.chat ?? '',
  member: zone === samarqand,
  link: zone === qoqon ? APP_LINK : (zone?.link ?? ''),
}));
const ride = (id: string): HistoryItem => ({
  id,
  from: '1726269',
  to: '1718401',
  departAt: NOW - 86_400_000,
  km: 300,
  price: 90000,
  seats: 1,
  people: ['Jasur'],
  given: 5,
  received: null,
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
  localStorage.setItem('route_recent', JSON.stringify([{ from: '1726269', to: '1703202' }]));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});

async function openChannels(clients: Overrides, driver = false) {
  renderProfile(
    {},
    {
      clients: { ...clients, channels: { mine: async () => made } },
      ...(driver ? { driver: approved } : {}),
    },
  );
  fireEvent.click(screen.getByText('Dilnoza'));
  fireEvent.click(await screen.findByText('Kanallar'));
  await screen.findByText('Siz uchun');
}

const passenger: Overrides = {
  comfort: { history: async () => [ride('h1'), ride('h2')] },
  market: { myRequests: async () => [request] },
};

describe('«Kanallar» of a person (G65, docs/119)', () => {
  it('offers the channels for the person with the reason, then all of them under their regions', async () => {
    await openChannels(passenger);
    expect(screen.getByText('Har bir kanalda shu joydagi yangi safarlar')).toBeTruthy();
    const forYou = screen.getByText('Siz uchun').nextElementSibling as HTMLElement;
    expect(within(forYou).getByText('Koʻp borasiz')).toBeTruthy();
    expect(within(forYou).getByText('Soʻrovingiz shu yerga')).toBeTruthy();
    expect(within(forYou).getByText('Oxirgi qidiruv')).toBeTruthy();
    expect(within(forYou).getByText('✓ Aʼzosiz')).toBeTruthy();
    expect(screen.getByText('Fargʻona viloyati')).toBeTruthy();
    // A channel by its name in Telegram without the brand (owner 13.10.2026, docs/176), in «Siz uchun»
    // and under its region.
    expect(screen.getAllByText('Margʻilon | Fargʻona shahri')).toHaveLength(2);
    expect(screen.getByText('Qamchiq | Furqat | Qoʻqon')).toBeTruthy();
    // Only the channels that are made: 4 here, 3 of them «Siz uchun» too.
    expect(screen.getAllByText(/Qoʻshilish|✓ Aʼzosiz/u)).toHaveLength(7);
  });

  it('finds a channel by a place or a region, and says when nothing is found', async () => {
    await openChannels(passenger);
    fireEvent.change(screen.getByPlaceholderText('Viloyat yoki shahar'), { target: { value: 'qoʻqon' } });
    expect(screen.queryByText('Siz uchun')).toBeNull();
    expect(screen.getAllByText(/Qoʻshilish|✓ Aʼzosiz/u)).toHaveLength(1);
    fireEvent.change(screen.getByPlaceholderText('Viloyat yoki shahar'), { target: { value: 'samarqand' } });
    expect(screen.getByText('✓ Aʼzosiz')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Viloyat yoki shahar'), { target: { value: 'xyz' } });
    expect(screen.getByText('Bunday kanal topilmadi')).toBeTruthy();
  });

  it('opens the channel in Telegram from «Qoʻshilish» by the own link of the app', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await openChannels(passenger);
    fireEvent.change(screen.getByPlaceholderText('Viloyat yoki shahar'), { target: { value: 'qoʻqon' } });
    fireEvent.click(screen.getByText('Qoʻshilish'));
    expect(open.mock.calls[0]?.[0]).toBe(APP_LINK);
    open.mockRestore();
  });

  it('gives a driver the reasons of a driver', async () => {
    const trips = [
      { ...trip, id: 'a', to: '1718401', departAt: NOW - 3 * 86_400_000 },
      { ...trip, id: 'b', to: '1718401', departAt: NOW - 2 * 86_400_000 },
      { ...trip, id: 'c', to: '1703202', departAt: NOW - 86_400_000 },
    ];
    const others = [request, { ...request, id: 'r2' }];
    const board = {
      known: true,
      date: '2026-10-09',
      days: [],
      trip: null,
      fits: [],
      others,
      carSeats: 4,
      busy: false,
      notify: null,
    };
    await openChannels({ market: { myTrips: async () => trips, requestBoard: async () => board } }, true);
    expect(screen.getByText('Safarlaringiz shu kanallarda chiqadi')).toBeTruthy();
    expect(screen.getByText('Koʻp yurasiz')).toBeTruthy();
    expect(screen.getByText('Soʻrovlar koʻp')).toBeTruthy();
    expect(screen.getByText('Oxirgi safaringiz')).toBeTruthy();
  });
});
