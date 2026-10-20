import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { approved, renderProfile } from './profile-test-kit';

// The photo of the profile loads as in «Profil» (profile.test.tsx): no real object URLs in jsdom.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

// G91 DRV-13: the driver app of an application still in review is that app already: no «Haydovchi
// boʻling» that opens it again.
describe('«Profil» in the driver app', () => {
  it('has no «Haydovchi boʻling» while the application is in review', () => {
    const pending = { ...approved, application: { ...approved.application, status: 'pending' as const } };
    renderProfile({}, { driver: pending });
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.queryByText('Haydovchi boʻling')).toBeNull();
  });
});
