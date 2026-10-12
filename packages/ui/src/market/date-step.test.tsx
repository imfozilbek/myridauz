import { DAY_MS, tashkentDate } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { DateStep } from './date-step';
import { renderMarket } from './market-test-kit';

afterEach(cleanup);

const NOW = Date.parse('2026-10-12T10:00:00+05:00');
const open = (initial?: string) => {
  const onDone = vi.fn();
  renderMarket(
    <DateStep now={NOW} {...(initial ? { initial } : {})} onBack={() => undefined} onDone={onDone} />,
    testClients({}),
  );
  return onDone;
};

// The day of a request in the row of the week (owner decision 12.10.2026, docs/172): 7 days from
// today, nothing further, no calendar of the phone.
describe('«Qaysi kuni?» of a request', () => {
  it('takes any of the 7 days from today in one tap', () => {
    const onDone = open();
    expect(screen.getByText('Qaysi kuni?').tagName).toBe('H1');
    expect(document.querySelectorAll('.week-day')).toHaveLength(7);
    expect(document.querySelector('.week-day[aria-pressed="true"]')).toBeNull();
    expect(screen.queryByText('Boshqa')).toBeNull();
    expect(document.querySelector('input[type="date"]')).toBeNull();
    fireEvent.click(screen.getByText('18'));
    expect(onDone).toHaveBeenCalledWith(tashkentDate(NOW + 6 * DAY_MS));
  });

  it('shows a day chosen before', () => {
    open(tashkentDate(NOW + 3 * DAY_MS));
    expect(document.querySelector('.week-day[aria-pressed="true"]')?.textContent).toContain('15');
  });
});
