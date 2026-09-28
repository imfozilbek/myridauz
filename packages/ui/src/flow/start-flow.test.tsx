import { loadBrand } from '@platform/brands';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInShell } from '../test-shell';
import { StartFlow } from './start-flow';

const ACTIONS = [
  { id: 'find_trip', icon: 'search', labelKey: 'common.passenger.findTrip' },
  { id: 'my_trips', icon: 'myTrips', labelKey: 'common.myTrips' },
] as const;

describe('StartFlow', () => {
  it('goes from welcome to the main screen, a section and back', () => {
    const brand = loadBrand();
    const { tracked } = renderInShell(
      <StartFlow welcomeIcon="search" welcome="common.passenger.welcome" actions={ACTIONS} />,
    );
    expect(screen.getByText(brand.name)).toBeTruthy();
    expect(screen.getByText(new RegExp(`${brand.slogan}.*Safar toping`))).toBeTruthy();

    fireEvent.click(screen.getByText('Davom etish'));
    expect(screen.getByText('Safar topish')).toBeTruthy();
    expect(screen.getByText('Mening safarlarim')).toBeTruthy();

    fireEvent.click(screen.getByText('Mening safarlarim'));
    expect(screen.getByText('Bu boʻlim tez orada ishga tushadi.')).toBeTruthy();

    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('Safar topish')).toBeTruthy();
    expect(tracked.map((event) => event.screen)).toEqual(['welcome', 'home', 'my_trips', 'home']);
  });
});
