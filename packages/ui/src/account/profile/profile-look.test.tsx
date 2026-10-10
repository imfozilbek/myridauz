import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { approved, NOW, renderProfile, standing } from './profile-test-kit';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const review = { id: 'r1', authorName: 'Madina', stars: 5, tags: [], text: 'Juda yaxshi', at: NOW };
const reviews = { rating: standing.rating, reviews: [review] };

describe('«Profil» of a driver and how the other side sees the person (G65)', () => {
  it('shows the car with its plate; a tap changes it', () => {
    renderProfile({}, { driver: approved });
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText(`Haydovchi · ${loadBrand().name} bilan 2 oy`)).toBeTruthy();
    expect(screen.getByText('Mashinam')).toBeTruthy();
    expect(screen.getByText('Cobalt, Oq')).toBeTruthy();
    fireEvent.click(screen.getByText('Mashinam'));
    expect(approved.editCar).toHaveBeenCalled();
  });

  // The card of «Safar» with its three numbers, «Baholarim» under it (G75, mockup g75/5 A).
  it('opens what passengers see: the car, the plate, the numbers, then «Baholarim»', async () => {
    renderProfile({}, { driver: approved, clients: { feedback: { reviewsOf: async () => reviews } } });
    fireEvent.click(screen.getByText('Dilnoza'));
    fireEvent.click(screen.getByText('Yoʻlovchilar meni qanday koʻradi ›'));
    expect(screen.getByText('Yoʻlovchilar sizni shunday koʻradi')).toBeTruthy();
    expect(screen.getByText('Chevrolet Cobalt, Oq')).toBeTruthy();
    await waitFor(() =>
      expect(document.querySelector('.look-stats')?.textContent).toBe('8baho12safar100%vaqtida'),
    );
    expect(screen.getByText('Telefon raqamingiz hech kimga koʻrinmaydi.')).toBeTruthy();
    fireEvent.click(screen.getByText('Baholarim'));
    expect(await screen.findByText('Madina')).toBeTruthy();
  });

  it('opens what drivers see of a passenger: the face, the name, the stars', async () => {
    renderProfile({}, { clients: { feedback: { reviewsOf: async () => reviews } } });
    fireEvent.click(screen.getByText('Dilnoza'));
    fireEvent.click(screen.getByText('Haydovchilar meni qanday koʻradi ›'));
    expect(screen.getByText('Haydovchilar sizni shunday koʻradi')).toBeTruthy();
    expect(await screen.findByText('★ 4,9')).toBeTruthy();
    expect(screen.queryByText('Mashinam')).toBeNull();
  });

  it('lists the reviews under «Baholarim», or says there is none yet', async () => {
    const reviewsOf = vi.fn(async () => reviews);
    renderProfile({}, { clients: { feedback: { reviewsOf } } });
    fireEvent.click(screen.getByText('Dilnoza'));
    fireEvent.click(await screen.findByText('Baholarim'));
    expect(await screen.findByText('Madina')).toBeTruthy();
    expect(screen.getByText('Juda yaxshi')).toBeTruthy();
    reviewsOf.mockResolvedValueOnce({ rating: { average: null, count: 0 }, reviews: [] });
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(await screen.findByText('Baholarim'));
    expect(await screen.findByText('Hali izoh yoʻq')).toBeTruthy();
  });

  it('counts the channels the person is in with their drawings (docs/119)', async () => {
    const [andijon, samarqand] = loadBrand().channels.filter(
      (zone) => zone.places.includes('1703202') || zone.places.includes('1718203'),
    );
    const mine = async () => [
      { username: andijon?.username ?? '', member: true },
      { username: samarqand?.username ?? '', member: true },
    ];
    renderProfile({}, { clients: { channels: { mine } } });
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(await screen.findByText('2 ta kanaldasiz')).toBeTruthy();
    expect(await screen.findByAltText(samarqand?.title ?? '')).toBeTruthy();
  });
});
