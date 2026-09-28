import { loadBrand } from '@platform/brands';
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
  it('goes from welcome to the main screen, a section and back', () => {
    const brand = loadBrand();
    const { tracked } = renderInShell(
      <StartFlow welcomeIcon="search" welcome="common.passenger.welcome" actions={ACTIONS} />,
    );
    expect(screen.getByText(brand.name)).toBeTruthy();
    expect(screen.getByText(brand.slogan)).toBeTruthy();
    expect(screen.getByText('Safar toping')).toBeTruthy();

    fireEvent.click(screen.getByText('Davom etish'));
    expect(screen.getByText('Safar topish')).toBeTruthy();
    expect(screen.getByText('Band qilingan joylar va suhbatlar')).toBeTruthy();

    fireEvent.click(screen.getByText('Mening safarlarim'));
    expect(screen.getByText('Bu boʻlim tez orada ishga tushadi.')).toBeTruthy();

    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('Safar topish')).toBeTruthy();
    expect(tracked.map((event) => event.screen)).toEqual(['welcome', 'home', 'my_trips', 'home']);
  });
});
