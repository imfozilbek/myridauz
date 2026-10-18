import type { AdminPitak, PitakChange, Where } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { locations, tap } from '../market/market-test-kit';
import { ManagementScreen } from '../manage/management-screen';
import { renderInShell, testClients } from '../test-shell';

const asked = vi.spyOn(window, 'confirm');
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const QOYLIQ: AdminPitak = {
  id: 'qoyliq',
  name: 'Qoʻyliq pitagi',
  hint: null,
  point: { lat: 41.2438, lng: 69.3394 },
  regionId: '1726',
  status: 'claude',
  updatedAt: 1,
};
const DIRECTION = { from: '1726', to: '1730', pitakId: null };
const CHANGES: PitakChange[] = [
  {
    subject: 'direction:1726>1730',
    before: null,
    after: JSON.stringify({ pitakId: 'qoyliq' }),
    by: 'Kamron',
    at: 2,
  },
  {
    subject: 'pitak:qoyliq',
    before: '{}',
    after: JSON.stringify({ name: 'Qoʻyliq', status: 'checked' }),
    by: 'Fozil',
    at: 1,
  },
];
const WHERE: Where = { district: '1726269', name: { step: 'landmark', name: 'Chorsu bozori' }, area: null };

function open() {
  const pitaks = {
    all: vi.fn(async () => ({ pitaks: [QOYLIQ], directions: [DIRECTION] })),
    add: vi.fn(async () => QOYLIQ),
    change: vi.fn(async () => QOYLIQ),
    direction: vi.fn(async () => DIRECTION),
    history: vi.fn(async () => CHANGES),
  };
  const map = {
    where: vi.fn(async () => WHERE),
    border: vi.fn(async () => Promise.reject(new Error('none'))),
    search: vi.fn(async () => []),
  };
  renderInShell(
    <ManagementScreen onBack={() => undefined} />,
    false,
    true,
    locations,
    testClients({ pitaks, map }),
  );
  return pitaks;
}

describe('Pitaklar: the pitaks of the team (G24, docs/72)', { timeout: 20_000 }, () => {
  it('shows the directions and chooses the main pitak of one', async () => {
    const pitaks = open();
    await tap('Pitaklar');
    await tap('Toshkent shahri → Fargʻona viloyati');
    // Each pitak a row with its state, the chosen one marked (G78 sheet 6).
    expect(document.querySelector('.manage-tone-success')).not.toBeNull();
    await tap('Qoʻyliq pitagi');
    expect(pitaks.direction).toHaveBeenCalledWith({ ...DIRECTION, pitakId: 'qoyliq' });
    expect(await screen.findByText('Barcha pitaklar')).toBeTruthy();
    // «Boshqaruv» reads them once for «64 ta», the screen once and once more after the choice.
    expect(pitaks.all).toHaveBeenCalledTimes(3);
  });

  it('adds a pitak with its point on the map and its status', async () => {
    const pitaks = open();
    await tap('Pitaklar');
    await tap('Pitak qoʻshish');
    fireEvent.change(screen.getByLabelText('Pitak nomi'), { target: { value: 'Chorsu pitagi' } });
    fireEvent.change(screen.getByLabelText('Moʻljal'), { target: { value: 'Metro yonida' } });
    await tap('Joyi xaritada');
    await screen.findByText('Chorsu bozori yaqinida', {}, { timeout: 3000 });
    await tap('Shu yerda');
    expect(await screen.findByText('Chorsu bozori yaqinida')).toBeTruthy();
    await tap('Tekshirilgan');
    await tap('Saqlash');
    expect(pitaks.add).toHaveBeenCalledWith({
      name: 'Chorsu pitagi',
      hint: 'Metro yonida',
      point: QOYLIQ.point,
      status: 'checked',
    });
  });

  it('closes a pitak and shows the history of changes', async () => {
    const pitaks = open();
    await tap('Pitaklar');
    await tap('Toshkent shahri · Tanlangan, tekshirilmagan');
    await tap('Yopilgan');
    await tap('Saqlash');
    expect(pitaks.change).toHaveBeenCalledWith('qoyliq', expect.objectContaining({ status: 'closed' }));
    await tap('Oʻzgarishlar tarixi');
    expect(await screen.findByText('Qoʻshildi: Qoʻyliq pitagi')).toBeTruthy();
    expect(screen.getByText('Qoʻyliq · Tekshirilgan')).toBeTruthy();
    // Who changed it (G45, docs/72).
    expect(screen.getByText(/, Kamron$/u)).toBeTruthy();
  });

  // G79 К8 (docs/170): an empty name takes the name of the place chosen on the map.
  it('names a new pitak by its place on the map', async () => {
    open();
    await tap('Pitaklar');
    await tap('Pitak qoʻshish');
    await tap('Joyi xaritada');
    await screen.findByText('Chorsu bozori yaqinida', {}, { timeout: 3000 });
    await tap('Shu yerda');
    expect(await screen.findByDisplayValue('Chorsu bozori')).toBeTruthy();
  });

  // G49: a pitak with a name keeps it when its point moves; «Orqaga» asks before losing a change.
  it('renames a pitak, keeps the name when the point moves and asks before leaving a change', async () => {
    const pitaks = open();
    await tap('Pitaklar');
    await tap('Toshkent shahri · Tanlangan, tekshirilmagan');
    fireEvent.change(screen.getByLabelText('Pitak nomi'), { target: { value: 'Qoʻyliq bozori' } });
    asked.mockReturnValueOnce(false);
    await tap('Orqaga');
    expect(asked).toHaveBeenCalledWith('Oʻzgarishlar saqlanmaydi. Chiqasizmi?');
    await tap('Joyi xaritada');
    await screen.findByText('Chorsu bozori yaqinida', {}, { timeout: 3000 });
    await tap('Shu yerda');
    expect(await screen.findByDisplayValue('Qoʻyliq bozori')).toBeTruthy();
    await tap('Saqlash');
    expect(pitaks.change).toHaveBeenCalledWith(
      'qoyliq',
      expect.objectContaining({ name: 'Qoʻyliq bozori', status: 'claude' }),
    );
  });
});
