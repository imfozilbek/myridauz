import type { AdminReviews, Journal, SoundsState } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TeamReviewsScreen } from '../feedback/team-reviews-screen';
import { JournalScreen } from '../manage/journal-screen';
import { renderMarket } from '../market/market-test-kit';
import { SoundsScreen } from '../sounds/sounds-screen';
import { testClients } from '../test-shell';
import { AdDetail } from '../waitlist/team/ad-detail';
import { AdLinksScreen } from '../waitlist/team/ad-links-screen';
import { DirectionScreen } from '../waitlist/team/direction-screen';
import { NAVBAT, renderTeamHome } from './team-test-kit';

afterEach(cleanup);

const down = async () => Promise.reject(new Error('down'));
const back = () => undefined;
const RETRY = 'Qayta urinish';
const SAID = 'Birozdan keyin qayta urinib koʻring.';

// G91 ADM-10: a failure of the team screens is said with «Qayta urinish», never an endless skeleton,
// an empty list or a tap that does nothing.
describe('a failure on a screen of the team', { timeout: 20_000 }, () => {
  it('of a screen that loads: the error with «Qayta urinish»', async () => {
    renderMarket(<AdDetail code="ad1" onBack={back} />, testClients({ waitlist: { adLink: down } }));
    expect(await screen.findByText(RETRY)).toBeTruthy();
    cleanup();
    renderMarket(
      <DirectionScreen region="1718" onBack={back} />,
      testClients({ waitlist: { direction: down } }),
    );
    expect(await screen.findByText(RETRY)).toBeTruthy();
    cleanup();
    renderMarket(<AdLinksScreen onBack={back} />, testClients({ waitlist: { adLinks: down } }));
    expect(await screen.findByText(RETRY)).toBeTruthy();
  });

  it('of a tap: the reason under it', async () => {
    const state = async (): Promise<SoundsState> => ({
      set: '1',
      sets: ['1', '2'],
      changedBy: null,
      changedAt: null,
    });
    renderMarket(<SoundsScreen onBack={back} />, testClients({ sounds: { state, pick: down } }));
    fireEvent.click(await screen.findByText('2-variant'));
    expect(await screen.findByText(SAID)).toBeTruthy();
    cleanup();
    const entry = { at: 1, member: 'Ali', kind: 'block' as const, subject: 'x', action: 'block:7' };
    let calls = 0;
    const journal = async (): Promise<Journal> => (calls++ === 0 ? { entries: [entry] } : down());
    renderMarket(<JournalScreen onBack={back} />, testClients({ team: { journal } }));
    fireEvent.click(await screen.findByText('Yana'));
    expect(await screen.findByText(SAID)).toBeTruthy();
    cleanup();
    const review = {
      id: 'r1',
      stars: 5,
      text: 'Yaxshi',
      tags: [],
      at: 1,
      hidden: false,
      author: { id: '00000000000000000000000000000001', firstName: 'Ali' },
      about: { id: '00000000000000000000000000000002', firstName: 'Vali' },
    };
    let asked = 0;
    const teamReviews = async (): Promise<AdminReviews> =>
      asked++ === 0 ? { reviews: [review], more: true } : down();
    renderMarket(<TeamReviewsScreen onBack={back} />, testClients({ feedback: { teamReviews } }));
    fireEvent.click(await screen.findByText('Yana'));
    expect(await screen.findByText(SAID)).toBeTruthy();
  });

  it('of «Navbat» on the main screen: the error with «Qayta urinish»', async () => {
    renderTeamHome('moderator', { team: { navbat: down, work: down } });
    expect(await screen.findByText(RETRY)).toBeTruthy();
  });

  it('of the numbers of the day: said in their place', async () => {
    renderTeamHome('moderator', { team: { navbat: async () => NAVBAT, work: down } });
    expect(await screen.findByText(SAID)).toBeTruthy();
  });
});
