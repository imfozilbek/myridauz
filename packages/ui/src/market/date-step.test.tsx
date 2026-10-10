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

// The day of a request in the look of «Qachon joʻnaysiz?» (G75, mockup g75/3 A phone 1): three tiles.
describe('«Qaysi kuni?» of a request', () => {
  it('takes today or tomorrow in one tap', () => {
    const onDone = open();
    expect(screen.getByText('Qaysi kuni?').tagName).toBe('H1');
    expect(document.querySelectorAll('.when-day')).toHaveLength(3);
    expect(document.querySelector('.when-day[aria-pressed="true"]')).toBeNull();
    fireEvent.click(screen.getByText('Ertaga'));
    expect(onDone).toHaveBeenCalledWith(tashkentDate(NOW + DAY_MS));
  });

  it('«Boshqa» opens the calendar, the day after tomorrow is ready', () => {
    const onDone = open();
    fireEvent.click(screen.getByText('Boshqa'));
    const field = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(field.value).toBe(tashkentDate(NOW + 2 * DAY_MS));
    fireEvent.click(screen.getByText('Davom etish'));
    expect(onDone).toHaveBeenCalledWith(tashkentDate(NOW + 2 * DAY_MS));
  });

  it('shows a day chosen before on its tile', () => {
    open(tashkentDate(NOW + 3 * DAY_MS));
    expect(document.querySelector('.when-day[aria-pressed="true"]')?.textContent).toContain('Boshqa');
  });
});
