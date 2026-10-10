import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderProfile, standing } from './profile-test-kit';
import { fireEvent } from '@testing-library/react';

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const WARNED = Date.parse('2026-10-08T10:00:00+05:00');
const open = (notes: object, rating = standing.rating) => {
  renderProfile(
    {},
    {
      clients: {
        feedback: { notes: async () => ({ hidden: false, warnedAt: null, ...notes }) },
        comfort: { standing: async () => ({ ...standing, rating }) },
      },
    },
  );
  fireEvent.click(screen.getByText('Dilnoza'));
};

// What the bot said once stays in «Profil» (G75, docs/158 З): a warning of the team, out of the
// search while complaints wait, a rating below the line of the brand.
describe('the notes of «Profil»', () => {
  it('shows the warning with its day and the search hiding', async () => {
    open({ hidden: true, warnedAt: WARNED });
    expect(await screen.findByText('Ogohlantirish · 8-okt')).toBeTruthy();
    expect(screen.getByText('Hozir qidiruvda koʻrinmaysiz: shikoyatlar tekshirilmoqda.')).toBeTruthy();
  });

  it('says a low rating once there are enough of them', async () => {
    open({}, { average: 3.2, count: 12 });
    expect(await screen.findByText(/^Reytingingiz 3,2/u)).toBeTruthy();
  });

  it('says nothing while all is well', async () => {
    open({});
    expect(await screen.findByText('8 baho')).toBeTruthy();
    expect(document.querySelector('.profile-notes')).toBeNull();
  });
});
