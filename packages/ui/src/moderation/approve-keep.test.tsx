import type { ApplicationSummary, DecisionInput } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { ApplicationsScreen } from './applications-screen';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

const application: ApplicationSummary = {
  userId: '00000000000000000000000000000005',
  firstName: 'Ali',
  status: 'pending',
  car: { make: 'Chevrolet', model: 'Nexia', color: 'black', plate: '10123ABC', seats: 4 },
  reasons: [],
  submittedAt: 1,
};

function setup() {
  const decide = vi.fn<(id: string, decision: DecisionInput) => Promise<ApplicationSummary>>(async () => {
    throw new Error('offline');
  });
  const clients = testClients({
    moderation: { queue: async () => [application], photo: async () => new Blob(['x']), decide },
  });
  renderInShell(<ApplicationsScreen onBack={() => undefined} />, false, true, undefined, clients);
  return decide;
}

describe('the moderator keeps what was done on an application (docs/94 B9, F3)', () => {
  it('the fixed plate survives Back and a failed decision', async () => {
    const decide = setup();
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(screen.getByText('Tasdiqlash'));
    fireEvent.click(await screen.findByText('Raqamni tuzatish'));
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '10 124 abc' } });
    fireEvent.click(screen.getByText('Davom etish'));
    await screen.findByText('Raqam rasm boʻyicha tuzatildi');
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(await screen.findByText('Tasdiqlash'));
    expect(await screen.findByText('10 124 ABC')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Raqam mos, tasdiqlash')));
    expect(await screen.findByText('Chevrolet Nexia')).toBeTruthy();
    fireEvent.click(screen.getByText('Tasdiqlash'));
    expect(await screen.findByText('10 124 ABC')).toBeTruthy();
    decide.mockResolvedValueOnce({ ...application, status: 'approved' });
    fireEvent.click(screen.getByText('Raqam mos, tasdiqlash'));
    await screen.findByText('Javob yuborildi');
    expect(decide).toHaveBeenLastCalledWith(application.userId, { action: 'approve', plate: '10124ABC' });
  });

  it('Back from ticked reasons asks before they are lost', async () => {
    setup();
    const asked = vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    fireEvent.click(await screen.findByText('Ali'));
    fireEvent.click(screen.getByText('Rad etish'));
    fireEvent.click((await screen.findAllByRole('checkbox'))[0] as HTMLElement);
    await act(async () => fireEvent.click(screen.getByText('Orqaga')));
    expect(asked).toHaveBeenCalledWith('Oʻzgarishlar saqlanmaydi. Chiqasizmi?');
    expect(screen.getAllByRole('checkbox')[0]).toHaveProperty('checked', true);
    asked.mockRestore();
  });
});
