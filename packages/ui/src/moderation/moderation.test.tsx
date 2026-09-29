import type { ApplicationSummary, DecisionInput } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
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
  year: 2018,
  plate: '10123ABC',
  seats: 4,
} as const;
const application: ApplicationSummary = {
  userId: 5,
  firstName: 'Ali',
  status: 'pending',
  car,
  reasons: [],
  submittedAt: 1,
};

function setup() {
  const decide = vi.fn(
    async (_id: number, decision: DecisionInput) =>
      ({
        ...application,
        status: decision.action === 'approve' ? 'approved' : 'rejected',
      }) as ApplicationSummary,
  );
  const block = vi.fn(async () => undefined);
  const clients = testClients({
    moderation: { queue: async () => [application], photo: async () => new Blob(['x']), decide, block },
  });
  renderInShell(<ApplicationsScreen onBack={() => undefined} />, false, true, undefined, clients);
  return { decide, block };
}

describe('ApplicationsScreen (docs/04)', () => {
  it('opens an application with its photos and approves it', async () => {
    const { decide } = setup();
    fireEvent.click(await screen.findByText('Ali'));
    expect(screen.getByText('Chevrolet Nexia')).toBeTruthy();
    expect((await screen.findAllByRole('img')).length).toBe(4);
    fireEvent.click(screen.getByText('Tasdiqlash'));
    expect(await screen.findByText('Javob yuborildi')).toBeTruthy();
    expect(decide).toHaveBeenCalledWith(5, { action: 'approve' });
  });

  it('asks for changes with ticked reasons and blocks for 7 days', async () => {
    const { decide, block } = setup();
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(screen.getByText('Tuzatishni soʻrash'));
    expect(screen.queryByText('Yuborish')).toBeNull();
    fireEvent.click(screen.getByText('Salon rasmi tiniq emas'));
    fireEvent.click(screen.getByText('Rasmda davlat raqami oʻqilmaydi'));
    fireEvent.click(screen.getByText('Yuborish'));
    await screen.findByText('Javob yuborildi');
    expect(decide).toHaveBeenCalledWith(5, {
      action: 'request_changes',
      reasons: ['plate_not_readable', 'interior_unclear'],
    });
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(screen.getByText('Bloklash'));
    fireEvent.click(screen.getByText('7 kun'));
    expect(await screen.findByText('Bloklandi')).toBeTruthy();
    expect(block).toHaveBeenCalledWith(5, 7);
  });
});
