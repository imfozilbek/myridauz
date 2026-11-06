import type { Journal, JournalKind } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { PERSON, renderManagement } from './manage-test-kit';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

const entry = (kind: JournalKind, action: string, at: number): Journal['entries'][number] => ({
  member: 'Aziz',
  kind,
  subject: PERSON,
  action,
  at,
});

const FARHOD = {
  userId: PERSON,
  firstName: 'Farhod',
  status: 'approved' as const,
  car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A777BC', seats: 4 } as const,
  reasons: [],
  submittedAt: 1,
  history: [],
  samePlate: 0,
  was: null,
  gender: 'male' as const,
};

// G95 (docs/224, mockup g95 screen 6): the fixes of the team in «Jurnal»; an application opens its case.
describe('the fixes of the team in «Jurnal»', () => {
  it('says the plate «было → стало» and opens the application, not the person', async () => {
    const now = Date.now();
    const journal = vi.fn(async () => ({
      entries: [entry('application', 'car:01A123BC:01A777BC', now), entry('application', 'reopen', now - 1)],
    }));
    const get = vi.fn(async () => FARHOD);
    renderManagement({ team: { journal }, moderation: { get, photo: async () => new Blob(['x']) } });
    await tap('Jurnal');
    expect(await screen.findByText('Mashina tuzatildi · 01 A 123 BC → 01 A 777 BC')).toBeTruthy();
    expect(screen.getByText('Rad etish bekor qilindi')).toBeTruthy();
    await tap('Rad etish bekor qilindi');
    expect(await screen.findByText('Farhod · ariza')).toBeTruthy();
    expect(get).toHaveBeenCalledWith(PERSON);
  });

  // The owner fixes a car the team approved by mistake from «Odam» too (mockup g95 screen 6).
  it('opens the application from the car of a person in «Odamlar»', async () => {
    const get = vi.fn(async () => FARHOD);
    const blocks = async () => ({ active: null, entries: [] });
    renderManagement({ moderation: { get, blocks, photo: async () => new Blob(['x']) } });
    await tap('Odamlar');
    fireEvent.change(screen.getByLabelText('ID raqami'), { target: { value: PERSON } });
    await tap('Ochish');
    await tap('Chevrolet Cobalt');
    expect(await screen.findByText('Farhod · ariza')).toBeTruthy();
  });
});
