import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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

describe('StartFlow', () => {
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
