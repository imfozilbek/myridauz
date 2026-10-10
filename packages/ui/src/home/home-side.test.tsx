import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AccountContext, useAccount } from '../account/account-context';
import { DriverSide, PassengerSide } from './home-side';
import { DRIVER_ACTIONS, PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';

afterEach(cleanup);

// A person with a photo and a rating: the right of the head shows «Bahom ★ 4,8».
function Rated() {
  const account = useAccount();
  const profile = account && { ...account.profile, hasAvatar: true, rating: 4.8 };
  return (
    <AccountContext.Provider value={account && profile && { ...account, profile }}>
      <PassengerSide openProfile={() => undefined} />
    </AccountContext.Provider>
  );
}

describe('the right of the head of a passenger (G76, mockup g76/1)', () => {
  it('shows the rating with the sign «★» in amber', async () => {
    renderHome(() => <Rated />, PASSENGER_ACTIONS, {});
    const star = await screen.findByText('★');
    expect(star.style.color).toBe('rgb(245, 158, 11)');
    expect(star.closest('button')?.textContent).toBe('Bahom★4,8');
  });
});

// A driver whose face photo the team refused: the head says it as for a passenger (G76).
function Refused() {
  const account = useAccount();
  const profile = account && { ...account.profile, hasAvatar: true, avatarStatus: 'rejected' as const };
  return (
    <AccountContext.Provider value={account && profile && { ...account, profile }}>
      <DriverSide openProfile={() => undefined} />
    </AccountContext.Provider>
  );
}

describe('the right of the head of a driver (G76, mockup g76/3)', () => {
  it('asks for a new photo in yellow when the team refused the face photo', async () => {
    renderHome(() => <Refused />, DRIVER_ACTIONS, {});
    const side = (await screen.findByText('Rasm qoʻshing')).closest('button');
    expect(side?.className).toContain('home-side-warn');
    expect(side?.textContent).toBe('Rasm qoʻshingTezroq tasdiq');
  });
});
