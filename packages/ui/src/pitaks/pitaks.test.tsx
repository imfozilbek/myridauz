import type { AdminPitak, PitakChange, Where } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { locations, tap } from '../market/market-test-kit';
import { ManagementScreen } from '../pricing/management-screen';
import { renderInShell, testClients } from '../test-shell';

afterEach(cleanup);

const QOYLIQ: AdminPitak = {
  id: 'qoyliq',
  name: 'Qoʻyliq pitagi',
  point: { lat: 41.2438, lng: 69.3394 },
  regionId: '1726',
  status: 'claude',
  updatedAt: 1,
};
const DIRECTION = { from: '1726', to: '1730', pitakId: null };
const CHANGES: PitakChange[] = [
  { subject: 'direction:1726>1730', before: null, after: JSON.stringify({ pitakId: 'qoyliq' }), at: 2 },
  {
    subject: 'pitak:qoyliq',
    before: '{}',
    after: JSON.stringify({ name: 'Qoʻyliq', status: 'checked' }),
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
    await tap('Qoʻyliq pitagi');
    expect(pitaks.direction).toHaveBeenCalledWith({ ...DIRECTION, pitakId: 'qoyliq' });
    expect(await screen.findByText('Barcha pitaklar')).toBeTruthy();
    expect(pitaks.all).toHaveBeenCalledTimes(2);
  });

  it('adds a pitak with its point on the map and its status', async () => {
    const pitaks = open();
    await tap('Pitaklar');
    await tap('Pitak qoʻshish');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Chorsu pitagi' } });
    await tap('Joyi xaritada');
    await screen.findByText('Chorsu bozori yaqinida', {}, { timeout: 3000 });
    await tap('Shu yerda');
    expect(await screen.findByText('Chorsu bozori yaqinida')).toBeTruthy();
    await tap('Tekshirilgan');
    await tap('Saqlash');
    expect(pitaks.add).toHaveBeenCalledWith({
      name: 'Chorsu pitagi',
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
  });
});
