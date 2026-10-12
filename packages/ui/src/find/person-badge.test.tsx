import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { PersonBadge, type FaceRole } from './person-badge';

afterEach(cleanup);

const face = (role: FaceRole) => {
  renderMarket(
    <PersonBadge id="7" name="Dilnoza" hasAvatar={false} size={50} role={role} />,
    testClients({}),
  );
  return document.querySelector<HTMLElement>('.person-badge');
};

// A face without a photo (owner decision 12.10.2026, docs/172): the icon of the role on its color,
// the passenger teal, the driver amber; never a letter.
describe('PersonBadge', () => {
  it('a passenger: the person icon on teal', () => {
    const badge = face('passenger');
    expect(badge?.textContent).toBe('');
    expect(badge?.querySelector('svg')?.getAttribute('class')).toContain('lucide-user-round');
    expect(badge?.querySelector('svg')?.getAttribute('width')).toBe('28');
    expect(badge?.style.background).toBe('rgb(204, 251, 241)');
    expect(badge?.style.color).toBe('rgb(15, 118, 110)');
  });

  it('a driver: the car icon on amber', () => {
    const badge = face('driver');
    expect(badge?.querySelector('svg')?.getAttribute('class')).toContain('lucide-car-front');
    expect(badge?.style.background).toBe('rgb(254, 243, 199)');
    expect(badge?.style.color).toBe('rgb(180, 83, 9)');
  });
});
