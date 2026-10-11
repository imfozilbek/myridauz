import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARD, PERSON } from '../manage/manage-test-kit';
import { PeopleScreen } from '../manage/people-screen';
import { tap } from '../market/market-test-kit';
import { renderInShell, testClients } from '../test-shell';
import { NAVBAT, renderTeamHome } from './team-test-kit';

afterEach(cleanup);

const OTHER = 'c'.repeat(32);
const low = (id: string, person: string, name: string) => ({
  id,
  at: 1,
  sign: { kind: 'rating' as const, name, person, average: 3.1, count: 12 },
});

// G79 К3 (docs/170): a card of «Diqqat» about two people and more opens the list of them in
// «Odamlar», not an empty field of the id (no path → 2 taps).
describe('«Diqqat» about many people', { timeout: 20_000 }, () => {
  it('opens «Odamlar» with the people of the card', async () => {
    const signs = [low('r1', PERSON, 'Jasur'), low('r2', OTHER, 'Madina'), low('r3', PERSON, 'Jasur')];
    const { go } = renderTeamHome('owner', {
      team: { navbat: async () => NAVBAT, attention: async () => ({ signs }) },
    });
    fireEvent.click(await screen.findByText('3 kishida reyting past'));
    expect(go).toHaveBeenCalledWith('people', {
      people: [
        { id: PERSON, name: 'Jasur' },
        { id: OTHER, name: 'Madina' },
      ],
    });
  });

  it('lists them in «Odamlar»: a tap opens one, «Назад» comes back to the list', async () => {
    const person = vi.fn(async () => CARD);
    const people = [
      { id: PERSON, name: 'Jasur' },
      { id: OTHER, name: 'Madina' },
    ];
    renderInShell(
      <PeopleScreen onBack={() => undefined} people={people} />,
      false,
      true,
      undefined,
      testClients({ team: { person } }),
    );
    await tap('Madina');
    expect(person).toHaveBeenCalledWith(OTHER);
    expect(await screen.findByText('Haydovchi: 5 · yoʻlovchi: 2')).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('Jasur')).toBeTruthy();
  });
});
