import type { ApplicationSummary } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { ApplicationsScreen } from './applications-screen';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

const car = { make: 'Chevrolet', model: 'Nexia', color: 'black', plate: '10123ABC', seats: 4 } as const;
const of = (userId: string, firstName: string): ApplicationSummary => ({
  userId,
  firstName,
  status: 'pending',
  car,
  reasons: [],
  submittedAt: 1,
});
const ALI = of('00000000000000000000000000000005', 'Ali');
const VALI = of('00000000000000000000000000000006', 'Vali');

function setup() {
  let queue = [ALI, VALI];
  const decide = vi.fn(async (userId: string) => {
    queue = queue.filter((application) => application.userId !== userId);
    return { ...ALI, status: 'approved' } as ApplicationSummary;
  });
  const clients = testClients({
    moderation: { queue: async () => queue, photo: async () => new Blob(['x']), decide },
  });
  renderInShell(<ApplicationsScreen onBack={() => undefined} />, false, true, undefined, clients);
}

describe('The moderator works the queue fast (docs/89 S8, S9)', () => {
  it('opens a photo on the whole screen and comes back', async () => {
    setup();
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(await screen.findByRole('button', { name: 'Yuz rasmi' }));
    expect(await screen.findAllByRole('img')).toHaveLength(1);
    expect(screen.queryByText('Chevrolet Nexia')).toBeNull();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(await screen.findByText('Chevrolet Nexia')).toBeTruthy();
  });

  it('after a decision opens the next application at once', async () => {
    setup();
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(screen.getByText('Tasdiqlash'));
    fireEvent.click(await screen.findByText('Raqam mos, tasdiqlash'));
    expect(await screen.findByText('Vali')).toBeTruthy();
    expect(screen.getByText('Javob yuborildi')).toBeTruthy();
    expect(screen.getByText('Chevrolet Nexia')).toBeTruthy();
  });
});
