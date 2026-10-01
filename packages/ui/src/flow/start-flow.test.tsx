import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../test-shell';
import { StartFlow } from './start-flow';

const ACTIONS = [
  {
    id: 'find_trip',
    icon: 'search',
    tone: 'brand',
    labelKey: 'common.passenger.findTrip',
    hintKey: 'common.passenger.findTripHint',
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.passenger.myTripsHint',
  },
] as const;

afterEach(cleanup);

describe('StartFlow', () => {
  it('does not repeat the action the main button already does (G25)', () => {
    renderInShell(<StartFlow actions={ACTIONS} covered="find_trip" />);
    // Only the main button says it: no row of the list repeats it.
    expect(screen.getAllByText('Safar topish')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Safar topish' }).tagName).toBe('BUTTON');
    expect(screen.getByText('Mening safarlarim')).toBeTruthy();
  });

  it('goes from the main screen to a section and back', () => {
    const { tracked } = renderInShell(<StartFlow actions={ACTIONS} />);
    expect(screen.getByText('Safar topish')).toBeTruthy();
    expect(screen.getByText('Band qilingan joylar va suhbatlar')).toBeTruthy();

    fireEvent.click(screen.getByText('Mening safarlarim'));
    expect(screen.getByText('Bu boʻlim tez orada ishga tushadi.')).toBeTruthy();

    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('Safar topish')).toBeTruthy();
    expect(tracked.map((event) => event.screen)).toEqual(['home', 'my_trips', 'home']);
  });
});
