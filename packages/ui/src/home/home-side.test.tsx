import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AccountContext, useAccount } from '../account/account-context';
import { PassengerSide } from './home-side';
import { PASSENGER_ACTIONS } from './home-test-actions';
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
