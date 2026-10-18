import type { PersonActivity } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { locations } from '../market/market-test-kit';
import { renderInShell, testClients } from '../test-shell';
import { CARD, PERSON } from './manage-test-kit';
import { PeopleScreen } from './people-screen';

afterEach(cleanup);

const AT = Date.parse('2026-10-15T05:00:00Z');
const route = { from: '1726269', to: '1730401', departAt: AT };
const ACTIVITY: PersonActivity = {
  trips: [{ id: 't1', ...route, status: 'completed' }],
  rides: [{ id: 'b1', tripId: 't2', ...route, status: 'cancelled_by_passenger' }],
  complaints: [{ id: 'c1', reasons: ['no_show'], status: 'resolved', at: AT }],
  cancels: { asDriver: 2, asPassenger: 1 },
};

// «Odamlar» (G45, docs/111): under the card, what the person did lately; the cancels after a «yes»
// are counted (docs/81 A07).
describe('what a person did lately', () => {
  it('shows the cancels, the newest trips, seats and complaints', async () => {
    const clients = testClients({ team: { person: async () => CARD, activity: async () => ACTIVITY } });
    renderInShell(<PeopleScreen person={PERSON} onBack={() => undefined} />, false, true, locations, clients);
    expect(await screen.findByText('Tasdiqlangan joyni bekor qilgan')).toBeTruthy();
    expect(screen.getByText('Haydovchi: 2 · yoʻlovchi: 1')).toBeTruthy();
    expect(await screen.findAllByText('Chilonzor → Fargʻona shahri')).toHaveLength(2);
    expect(screen.getByText(/Yakunlangan$/u)).toBeTruthy();
    expect(screen.getByText(/Bekor qilingan$/u)).toBeTruthy();
    expect(screen.getByText('Kelmadi')).toBeTruthy();
    expect(screen.getByText(/Hal qilindi$/u)).toBeTruthy();
  });
});
