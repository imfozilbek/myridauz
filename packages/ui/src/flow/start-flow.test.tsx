import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScreenView } from '../context/analytics-context';
import { renderInShell } from '../test-shell';
import type { HomeGo } from './start-action';
import { StartFlow } from './start-flow';

// A section of the test: what an action opens, with its own way back.
function Section({ onBack }: { readonly onBack: () => void }) {
  useScreenView('section');
  return <button onClick={onBack}>section</button>;
}
const ACTIONS = [
  {
    id: 'find_trip',
    icon: 'search',
    tone: 'brand',
    labelKey: 'common.passenger.findTrip',
    hintKey: 'common.passenger.findTripHint',
    Screen: Section,
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.passenger.myTripsHint',
    Screen: Section,
  },
] as const;

afterEach(cleanup);

// The tiles of the main screen open the sections by go (G53): here one button does it.
const tiles = (go: HomeGo) => (
  <button type="button" onClick={() => go('my_trips')}>
    Mening safarlarim
  </button>
);
const HOME = 'Mening safarlarim';

describe('StartFlow', () => {
  it('starts with the profile, without a big title over it (owner decision 01.10.2026)', () => {
    renderInShell(<StartFlow actions={ACTIONS} />);
    expect(screen.queryByRole('heading', { name: loadBrand().name })).toBeNull();
  });

  it('opens a section at once by the link of a bot button, back goes to the main screen (G62)', () => {
    window.history.replaceState(null, '', '/?open=my_trips');
    renderInShell(<StartFlow actions={ACTIONS} tiles={tiles} />);
    fireEvent.click(screen.getByText('section'));
    expect(screen.getByText(HOME)).toBeTruthy();
    // Forgotten once opened (G77): a gate mounted again shows the main screen, not the section.
    expect(window.location.search).toBe('');
    cleanup();
    renderInShell(<StartFlow actions={ACTIONS} tiles={tiles} />);
    expect(screen.queryByText('section')).toBeNull();
    window.history.replaceState(null, '', '/');
  });

  it('goes from the main screen to a section and back', () => {
    const { tracked } = renderInShell(<StartFlow actions={ACTIONS} tiles={tiles} />);
    fireEvent.click(screen.getByText(HOME));
    fireEvent.click(screen.getByText('section'));
    expect(screen.getByText(HOME)).toBeTruthy();
    expect(tracked.map((event) => event.screen)).toEqual(['home', 'section', 'home']);
  });

  it('keeps the app when a section breaks: «Orqaga» goes to the main screen (G52, docs/112)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Broken = (): never => {
      throw new Error('boom');
    };
    const broken = [{ ...ACTIONS[1], Screen: Broken }];
    const { tracked } = renderInShell(<StartFlow actions={broken} tiles={tiles} />);
    fireEvent.click(screen.getByText(HOME));
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
    expect(tracked.at(-1)).toMatchObject({ name: 'client_error', screen: 'home', detail: 'boom' });
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText(HOME)).toBeTruthy();
  });

  it('keeps the main screen when its block of trips breaks (G52)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Broken = (): never => {
      throw new Error('boom');
    };
    renderInShell(<StartFlow actions={ACTIONS} tiles={tiles} home={() => <Broken />} />);
    expect(screen.getByText(HOME)).toBeTruthy();
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
  });
});
