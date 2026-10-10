import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addAppToHomeScreen } from '../../telegram/home-screen';
import { renderProfile } from './profile-test-kit';

const can = vi.hoisted(() => ({ value: true }));
vi.mock('../../telegram/home-screen', () => ({
  useCanAddToHomeScreen: () => can.value,
  addAppToHomeScreen: vi.fn(),
}));

// The photo of the profile shows from a blob, as in profile.test.tsx.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

// «Bosh ekranga qoʻshish» is a row of «Sozlamalar», not a block of the main screen (owner decision
// 10.10.2026, docs/159): one tap puts the app on the phone's screen.
describe('«Bosh ekranga qoʻshish» in «Sozlamalar»', () => {
  it('adds the icon to the phone in one tap, then the row is gone', () => {
    can.value = true;
    renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    fireEvent.click(screen.getByText('Bosh ekranga qoʻshish'));
    expect(addAppToHomeScreen).toHaveBeenCalledOnce();
    expect(screen.queryByText('Bosh ekranga qoʻshish')).toBeNull();
  });

  it('is not offered when Telegram cannot add it or it is already there', () => {
    can.value = false;
    renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.queryByText('Bosh ekranga qoʻshish')).toBeNull();
  });
});
