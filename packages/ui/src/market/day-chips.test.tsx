import { DAY_MS, tashkentDate } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DayChips } from './day-chips';
import { renderMarket } from './market-test-kit';

afterEach(cleanup);

describe('the day chips (G35, docs/97 K2)', () => {
  it('shows another chosen day on its chip, so no title repeats it (G40, docs/106 C6)', () => {
    const now = Date.parse('2026-10-03T06:00:00Z');
    renderMarket(
      <DayChips
        date={tashkentDate(now + 3 * DAY_MS)}
        now={now}
        onDay={() => undefined}
        onOther={() => undefined}
      />,
    );
    expect(screen.queryByText('Boshqa kun')).toBeNull();
    expect(screen.getByRole('tab', { name: '6-oktabr', selected: true })).toBeTruthy();
  });
});
