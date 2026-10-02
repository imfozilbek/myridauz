import type { ApplicationSummary } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pullDown, rows, scrolledTo, skeleton } from '../market/list-test-kit';
import { renderInShell, testClients } from '../test-shell';
import { ApplicationsScreen } from './applications-screen';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

const application = (userId: string, firstName: string): ApplicationSummary => ({
  userId,
  firstName,
  status: 'pending',
  car: { make: 'Chevrolet', model: 'Nexia', color: 'black', plate: '10123ABC', seats: 4 },
  reasons: [],
  submittedAt: 1,
});
const QUEUE = [
  application('00000000000000000000000000000005', 'Ali'),
  application('00000000000000000000000000000006', 'Vali'),
];

function setup() {
  const queue = vi.fn(async () => QUEUE);
  const get = vi.fn(async (): Promise<never> => {
    throw new Error('test.no_history');
  });
  const clients = testClients({ moderation: { queue, get, photo: async () => new Blob(['x']) } });
  renderInShell(<ApplicationsScreen onBack={() => undefined} />, false, true, undefined, clients);
  return { queue, get };
}

describe('The queue of applications (docs/94 F2, S3, S7, W1)', () => {
  it('back from an application: the same rows at the same place, refreshed quietly', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');
    const { queue } = setup();
    await screen.findByText('Vali');
    scrolledTo(500);
    fireEvent.click(screen.getByText('Vali'));
    fireEvent.click(screen.getByText('Orqaga'));
    expect(skeleton()).toBeNull();
    expect(rows()).toEqual(QUEUE.map((item) => item.userId));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 500);
    await waitFor(() => expect(queue).toHaveBeenCalledTimes(2));
    await pullDown();
    expect(queue).toHaveBeenCalledTimes(3);
    expect(skeleton()).toBeNull();
  });

  it('a photo opens over the application: the history is not loaded again, the place stays', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');
    const { get } = setup();
    fireEvent.click(await screen.findByText('Ali'));
    await waitFor(() => expect(get).toHaveBeenCalledOnce());
    scrolledTo(300);
    fireEvent.click(await screen.findByRole('button', { name: 'Yuz rasmi' }));
    fireEvent.click(screen.getByText('Orqaga'));
    expect(await screen.findByText('Chevrolet Nexia')).toBeTruthy();
    expect(scrollTo).toHaveBeenLastCalledWith(0, 300);
    expect(get).toHaveBeenCalledOnce();
  });
});
