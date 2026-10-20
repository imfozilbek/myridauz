import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { approved, renderProfile } from './profile-test-kit';

afterEach(cleanup);

// G90 DRV-13: the driver app of an application still in review is that app already: no «Haydovchi
// boʻling» that opens it again.
describe('«Profil» in the driver app', () => {
  it('has no «Haydovchi boʻling» while the application is in review', () => {
    const pending = { ...approved, application: { ...approved.application, status: 'pending' as const } };
    renderProfile({}, { driver: pending });
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.queryByText('Haydovchi boʻling')).toBeNull();
  });
});
