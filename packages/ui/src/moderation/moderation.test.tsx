import { ApiError } from '@platform/api-client';
import type { ApplicationDetail, ApplicationSummary, DecisionInput } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { ApplicationsScreen } from './applications-screen';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

const car = {
  make: 'Chevrolet',
  model: 'Nexia',
  color: 'black',
  plate: '10123ABC',
  seats: 4,
} as const;
const application: ApplicationSummary = {
  userId: '00000000000000000000000000000005',
  firstName: 'Ali',
  status: 'pending',
  car,
  reasons: [],
  submittedAt: 1,
};

function setup(get?: (userId: string) => Promise<ApplicationDetail>) {
  const decide = vi.fn(
    async (_id: string, decision: DecisionInput) =>
      ({
        ...application,
        status: decision.action === 'approve' ? 'approved' : 'rejected',
      }) as ApplicationSummary,
  );
  const block = vi.fn(async () => undefined);
  const clients = testClients({
    moderation: {
      queue: async () => [application],
      photo: async () => new Blob(['x']),
      decide,
      block,
      ...(get ? { get } : {}),
    },
  });
  renderInShell(<ApplicationsScreen onBack={() => undefined} />, false, true, undefined, clients);
  return { decide, block };
}

describe('ApplicationsScreen (docs/04)', () => {
  it('opens an application with its photos and approves it', async () => {
    const { decide } = setup();
    fireEvent.click(await screen.findByText('Ali'));
    expect(screen.getByText('Chevrolet Nexia')).toBeTruthy();
    // Four photos and the plate.
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(5));
    // "Tasdiqlash" is the main button at the bottom, "Rad etish" a red row (docs/86 V10).
    expect(screen.getByText('Rad etish').className).toBe('danger-text');
    expect(screen.getByText('Tuzatish').className).not.toBe('danger-text');
    expect(screen.getByText('Tasdiqlash').closest('button')).not.toBeNull();
    fireEvent.click(screen.getByText('Tasdiqlash'));
    // The plate is compared with the front photo first (docs/50).
    expect(await screen.findByText('Raqamni tekshiring')).toBeTruthy();
    expect(screen.getByRole('img', { name: '10 123 ABC' })).toBeTruthy();
    fireEvent.click(screen.getByText('Raqam mos, tasdiqlash'));
    expect(await screen.findByText('Javob yuborildi')).toBeTruthy();
    expect(decide).toHaveBeenCalledWith('00000000000000000000000000000005', { action: 'approve' });
  });

  it('fixes the plate by the photo and approves with it', async () => {
    const { decide } = setup();
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(screen.getByText('Tasdiqlash'));
    fireEvent.click(await screen.findByText('Raqamni tuzatish'));
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '10 124 abc' } });
    fireEvent.click(screen.getByText('Davom etish'));
    expect(await screen.findByText('Raqam rasm boʻyicha tuzatildi')).toBeTruthy();
    expect(screen.getByRole('img', { name: '10 124 ABC' })).toBeTruthy();
    fireEvent.click(screen.getByText('Raqam mos, tasdiqlash'));
    await screen.findByText('Javob yuborildi');
    expect(decide).toHaveBeenCalledWith('00000000000000000000000000000005', {
      action: 'approve',
      plate: '10124ABC',
    });
  });

  it('opens the application of a link from the admin bot', async () => {
    window.history.replaceState(null, '', '/?application=00000000000000000000000000000005');
    setup(async () => ({ ...application, history: [], samePlate: 0, was: null }));
    expect(await screen.findByText('Chevrolet Nexia')).toBeTruthy();
    expect(window.location.search).toBe('');
  });

  it('asks for changes with ticked reasons and blocks for 7 days', async () => {
    const { decide, block } = setup();
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(screen.getByText('Tuzatish'));
    expect(screen.queryByText('Yuborish')).toBeNull();
    fireEvent.click(screen.getByText('Salon rasmi tiniq emas'));
    fireEvent.click(screen.getByText('Rasmda davlat raqami oʻqilmaydi'));
    fireEvent.click(screen.getByText('Yuborish'));
    await screen.findByText('Javob yuborildi');
    expect(decide).toHaveBeenCalledWith('00000000000000000000000000000005', {
      action: 'request_changes',
      reasons: ['plate_not_readable', 'interior_unclear'],
    });
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(screen.getByText('Bloklash'));
    // A block for good is asked first: "no" blocks nobody (docs/65 B4).
    vi.stubGlobal('confirm', () => false);
    fireEvent.click(screen.getByText('Butunlay'));
    vi.unstubAllGlobals();
    expect(block).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('7 kun'));
    expect(await screen.findByText('Bloklandi')).toBeTruthy();
    expect(block).toHaveBeenCalledWith('00000000000000000000000000000005', 7);
  });

  it('stays on the application with the reason when the decision did not go through (G43)', async () => {
    const { decide } = setup();
    decide.mockRejectedValueOnce(new ApiError(409, 'drivers.wrong_status'));
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(screen.getByText('Tasdiqlash'));
    fireEvent.click(await screen.findByText('Raqam mos, tasdiqlash'));
    expect(await screen.findByText(/Bu ariza allaqachon koʻrib chiqilgan/u)).toBeTruthy();
    expect(screen.getByText('Chevrolet Nexia')).toBeTruthy();
  });
});
