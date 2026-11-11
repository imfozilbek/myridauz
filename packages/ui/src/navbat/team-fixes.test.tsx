import { toCyrillic } from '@platform/i18n';
import type { ApplicationDetail, MyDecision, TeamMe } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { MyDecisionsScreen } from './my-decisions-screen';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();

// G95 (docs/224, mockup g95): a member finds the own decision and fixes it.
const FARHOD = '1'.repeat(32);
const BOBUR = '2'.repeat(32);
const AT = Date.parse('2026-10-01T09:00:00Z');
const COBALT = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 } as const;
const DECISIONS: MyDecision[] = [
  { userId: FARHOD, firstName: 'Farhod', status: 'approved', plate: '01A123BC', at: AT },
  { userId: BOBUR, firstName: 'Bobur', status: 'rejected', plate: '30B456CA', at: AT - 1 },
];
const detail = (
  userId: string,
  firstName: string,
  status: ApplicationDetail['status'],
): ApplicationDetail => ({
  userId,
  firstName,
  status,
  car: COBALT,
  reasons: [],
  submittedAt: AT - 1,
  history: [{ status, reasons: status === 'rejected' ? ['plate_not_readable'] : [], at: AT }],
  samePlate: 0,
  was: null,
  gender: 'male',
});

function renderMine(role: TeamMe['role'] = 'moderator') {
  const fixCar = vi.fn(async () => detail(FARHOD, 'Farhod', 'approved'));
  const decide = vi.fn(async () => detail(FARHOD, 'Farhod', 'changes_requested'));
  const reopen = vi.fn(async () => undefined);
  const clients = testClients({
    moderation: {
      me: async () => ({ id: null, firstName: 'Aziz', hasAvatar: false, role }),
      myDecisions: async () => DECISIONS,
      get: async (id: string) =>
        id === FARHOD ? detail(FARHOD, 'Farhod', 'approved') : detail(BOBUR, 'Bobur', 'rejected'),
      photo: async () => new Blob(['x']),
      fixCar,
      decide,
      reopen,
    },
  });
  renderInShell(<MyDecisionsScreen onBack={() => undefined} />, false, true, undefined, clients);
  return { fixCar, decide, reopen };
}

describe('«Mening qarorlarim»', () => {
  it('lists the own decisions with the decision and the plate in one line', async () => {
    renderMine();
    expect(await screen.findByText(toCyrillic('Mening qarorlarim'))).toBeTruthy();
    expect(screen.getByText(`${toCyrillic('Tasdiqlangan')} · 01 A 123 BC`)).toBeTruthy();
    expect(screen.getByText(`${toCyrillic('Rad etilgan')} · 30 B 456 CA`)).toBeTruthy();
  });

  it('fixes the approved car by its photo: «Saqlash» only after a change', async () => {
    const { fixCar } = renderMine();
    fireEvent.click(await screen.findByText('Farhod'));
    expect(await screen.findByText(toCyrillic('Tasdiqlangan · 1-oktabr'))).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Mashinani tuzatish')));
    expect(await screen.findByText(toCyrillic('Rasmdagi mashinaga qarab tuzating'))).toBeTruthy();
    expect((screen.getByText(toCyrillic('Saqlash')).closest('button') as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.change(screen.getByLabelText(toCyrillic('Davlat raqami')), {
      target: { value: '01 a 777 bc' },
    });
    await act(async () => fireEvent.click(screen.getByText(toCyrillic('Saqlash'))));
    expect(fixCar).toHaveBeenCalledWith(FARHOD, { ...COBALT, plate: '01A777BC' });
    expect(await screen.findByText(`Farhod · ${toCyrillic('ariza')}`)).toBeTruthy();
  });

  it('sends an approved application back with the ticked reasons', async () => {
    const { decide } = renderMine();
    fireEvent.click(await screen.findByText('Farhod'));
    fireEvent.click(await screen.findByText(toCyrillic('Tuzatishga qaytarish')));
    fireEvent.click(await screen.findByText(toCyrillic('Raqam rasmi aniq emas')));
    await act(async () => fireEvent.click(screen.getByText(toCyrillic('Yuborish'))));
    expect(decide).toHaveBeenCalledWith(FARHOD, {
      action: 'request_changes',
      reasons: ['plate_not_readable'],
    });
  });

  it('shows why a refusal was given; only the owner sends it back to «Navbat», after a question', async () => {
    const { reopen } = renderMine('owner');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(await screen.findByText('Bobur'));
    expect(await screen.findByText(toCyrillic('Raqam rasmi aniq emas'))).toBeTruthy();
    await act(async () => fireEvent.click(await screen.findByText(toCyrillic('Rad etishni bekor qilish'))));
    expect(window.confirm).toHaveBeenCalledWith(
      toCyrillic('Rad etishni bekor qilasizmi? Ariza yana navbatga tushadi.'),
    );
    expect(reopen).toHaveBeenCalledWith(BOBUR);
  });

  it('gives a moderator no way to undo a refusal', async () => {
    renderMine('moderator');
    fireEvent.click(await screen.findByText('Bobur'));
    expect(await screen.findByText(`Bobur · ${toCyrillic('ariza')}`)).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Rad etishni bekor qilish'))).toBeNull();
  });
});
