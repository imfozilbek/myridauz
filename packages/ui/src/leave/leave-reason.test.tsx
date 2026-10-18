import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pressBack } from '../test-native';
import { renderInShell } from '../test-shell';
import { useAskLeaveReason } from './leave-reason';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
afterEach(cleanup);

function Cancel({ kind }: { readonly kind: 'booking' | 'trip' | 'account' }) {
  const ask = useAskLeaveReason();
  return (
    <button type="button" onClick={() => ask(kind)}>
      cancelled
    </button>
  );
}

// G87 (docs/191): after a cancel, one tap tells why; it may be skipped; only the ids are counted.
describe('the reason of leaving', () => {
  it('asks why a seat was cancelled and counts the one reason tapped', async () => {
    const { tracked } = renderInShell(<Cancel kind="booking" />);
    fireEvent.click(screen.getByText('cancelled'));
    expect(await screen.findByText('Nega joyni bekor qildingiz?')).toBeTruthy();
    expect(
      screen.getByText('Javob berish shart emas. Bu bizga yaxshiroq boʻlishga yordam beradi.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Boshqa yoʻl topdim'));
    expect(tracked.filter((event) => event.name === 'leave_reason')).toEqual([
      { name: 'leave_reason', screen: 'leave.booking', kind: 'booking', reason: 'found_other' },
    ]);
    expect(screen.queryByText('Nega joyni bekor qildingiz?')).toBeNull();
  });

  it('gives each kind its own reasons and counts nothing when skipped', async () => {
    const { tracked } = renderInShell(<Cancel kind="trip" />, true);
    fireEvent.click(screen.getByText('cancelled'));
    expect(await screen.findByText('Nega safarni bekor qildingiz?')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchi topilmadi')).toBeTruthy();
    expect(screen.queryByText('Boshqa yoʻl topdim')).toBeNull();
    // «Назад» of Telegram or a swipe down: no answer.
    act(pressBack);
    expect(screen.queryByText('Nega safarni bekor qildingiz?')).toBeNull();
    expect(tracked.some((event) => event.name === 'leave_reason')).toBe(false);
  });
});
