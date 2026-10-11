import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NAVBAT, renderTeamHome, WORK } from './team-test-kit';

afterEach(cleanup);

// The main screen of the team (G75, docs/120, mockup g67/1).
describe('the main screen of the team', () => {
  it('gives the owner «Diqqat», «Navbat» and «Boshqaruv», no numbers of the day', async () => {
    renderTeamHome('owner');
    expect(await screen.findByText('2 ta xato bugun')).toBeTruthy();
    expect(screen.getByText('Statistika → Xatolar')).toBeTruthy();
    expect(screen.getByText('3 haydovchida pul kam')).toBeTruthy();
    expect(screen.getByText('5 joydan kam qoldi')).toBeTruthy();
    expect(await screen.findByText('Shikoyat: Madina → Jasur')).toBeTruthy();
    expect(screen.getByText('Boshqaruv')).toBeTruthy();
    expect(screen.queryByText('bugun qildingiz')).toBeNull();
  });

  it('gives a moderator «Navbat» and the own numbers, no «Diqqat» and no «Boshqaruv»', async () => {
    renderTeamHome('moderator');
    const done = await screen.findByText('bugun qildingiz');
    expect(done.parentElement?.textContent).toBe('14bugun qildingiz');
    expect(screen.getByText('kutmoqda').parentElement?.textContent).toBe('4kutmoqda');
    expect(screen.getByText('30 daqdan oshgan')).toBeTruthy();
    expect(screen.queryByText('Diqqat')).toBeNull();
    expect(screen.queryByText('Boshqaruv')).toBeNull();
  });

  it('lets a moderator read «Statistika» and «Kanallar» (owner decision 06.10.2026)', async () => {
    const { go } = renderTeamHome('moderator');
    fireEvent.click(await screen.findByText('Statistika'));
    expect(go).toHaveBeenCalledWith('statistics');
    fireEvent.click(screen.getByText('Kanallar'));
    expect(go).toHaveBeenCalledWith('channels');
  });

  it('lists every case the oldest first, a late one red, who opened it', async () => {
    renderTeamHome('moderator');
    const late = await screen.findByText('2 soat');
    expect(late.className).toContain('navbat-late');
    expect(screen.getByText('Ariza: Jasur')).toBeTruthy();
    expect(screen.getByText('Cobalt · 01 A 123 BC')).toBeTruthy();
    expect(screen.getByText('Kelmadi')).toBeTruthy();
    expect(screen.getByText('Aziz koʻrmoqda')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchi')).toBeTruthy();
    expect(screen.getByText('25 daq').className).not.toContain('navbat-late');
  });

  it('filters by kind with the numbers, and opens a case in its filter', async () => {
    const { go } = renderTeamHome('moderator');
    const chips = await screen.findByRole('radiogroup');
    expect(
      within(chips)
        .getByRole('radio', { name: /Hammasi 4/u })
        .getAttribute('aria-checked'),
    ).toBe('true');
    fireEvent.click(within(chips).getByRole('radio', { name: /Arizalar 2/u }));
    expect(screen.queryByText('Shikoyat: Madina → Jasur')).toBeNull();
    fireEvent.click(screen.getByText('Ariza: Bobur'));
    expect(go).toHaveBeenCalledWith('navbat', {
      navbat: { filter: 'application', kind: 'application', id: NAVBAT.items[2]?.id },
    });
    // Back on the main screen after the case the filter is still the one chosen (G77).
    cleanup();
    renderTeamHome('moderator');
    const again = await screen.findByRole('radiogroup');
    expect(
      within(again)
        .getByRole('radio', { name: /Arizalar 2/u })
        .getAttribute('aria-checked'),
    ).toBe('true');
    expect(screen.queryByText('Shikoyat: Madina → Jasur')).toBeNull();
  });

  it('shows the oldest cases that fit one screen: 4 to the owner, 6 to a moderator', async () => {
    const face = NAVBAT.items[3];
    if (face?.kind !== 'face') throw new Error('the kit has a photo fourth');
    const many = Array.from({ length: 9 }, (_, n) => ({
      ...face,
      id: String(n).repeat(32),
      name: `Odam ${n}`,
    }));
    const navbat = { items: many, counts: { application: 0, complaint: 0, face: 9, support: 0 } };
    renderTeamHome('owner', { team: { navbat: async () => navbat, attention: async () => ({ signs: [] }) } });
    expect(await screen.findByText('Rasm: Odam 3')).toBeTruthy();
    expect(screen.queryByText('Rasm: Odam 4')).toBeNull();
    cleanup();
    renderTeamHome('moderator', { team: { navbat: async () => navbat, work: async () => WORK } });
    expect(await screen.findByText('Rasm: Odam 5')).toBeTruthy();
    expect(screen.queryByText('Rasm: Odam 6')).toBeNull();
  });

  it('shows the photo of the member, loaded with the signature of the admin app', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:face');
    const avatar = vi.fn(async () => new Blob(['x']));
    const id = 'a'.repeat(32);
    renderTeamHome('owner', {
      moderation: { me: async () => ({ id, firstName: 'Fozil', hasAvatar: true, role: 'owner' }) },
      team: { navbat: async () => NAVBAT, attention: async () => ({ signs: [] }), avatar },
    });
    expect((await screen.findByRole('img', { name: 'Fozil' })).getAttribute('src')).toBe('blob:face');
    expect(avatar).toHaveBeenCalledWith(id);
  });

  it('opens the one person of a sign in «Odamlar», a sign of many in the list', async () => {
    const person = 'a'.repeat(32);
    const signs = [
      {
        id: 'rating:1',
        at: 1,
        sign: { kind: 'rating' as const, name: 'Jasur', person, average: 3.1, count: 12 },
      },
    ];
    const { go } = renderTeamHome('owner', {
      team: { navbat: async () => NAVBAT, attention: async () => ({ signs }) },
    });
    fireEvent.click(await screen.findByText('1 kishida reyting past'));
    expect(go).toHaveBeenCalledWith('people', { person });
  });

  it('says «Hammasi koʻrildi» when nothing waits', async () => {
    const empty = { items: [], counts: { application: 0, complaint: 0, face: 0, support: 0 } };
    renderTeamHome('moderator', {
      team: {
        navbat: async () => empty,
        work: async () => ({ done: 0, waiting: 0, averageMinutes: 0, over: 0 }),
      },
    });
    expect(await screen.findByText('Hammasi koʻrildi')).toBeTruthy();
  });
});
