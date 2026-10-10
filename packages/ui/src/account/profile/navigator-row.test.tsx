import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { savedNavigator } from '../../bookings/navigator-choice';
import { approved, renderProfile } from './profile-test-kit';

// The photo of the profile is a blob address (as in profile.test.tsx).
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// The navigator of the driver in «Sozlamalar» (G75, docs/124 Ё): chosen or changed here too, not only
// on the map of a trip.
describe('«Navigator» in «Sozlamalar»', () => {
  it('lets a driver choose the navigator; a passenger has no such row', async () => {
    renderProfile({}, { driver: approved });
    fireEvent.click(screen.getByText('Dilnoza'));
    fireEvent.click(screen.getByText('Navigator'));
    fireEvent.click(await screen.findByText('Google'));
    expect(savedNavigator()).toBe('google');
    expect(screen.getByText('Navigator').parentElement?.textContent).toBe('NavigatorGoogle');
    cleanup();
    renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.queryByText('Navigator')).toBeNull();
  });
});
