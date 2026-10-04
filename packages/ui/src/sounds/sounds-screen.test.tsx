import type { SoundsState } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetAudio } from './audio';
import { tap } from '../market/market-test-kit';
import { ManagementScreen } from '../pricing/management-screen';
import { renderInShell, testClients } from '../test-shell';

afterEach(() => {
  cleanup();
  forgetAudio();
  vi.unstubAllGlobals();
});

const state = (set: string, canEdit: boolean): SoundsState => ({
  set,
  sets: ['1', '2', '3'],
  changedBy: null,
  changedAt: null,
  canEdit,
});

function open(loaded: SoundsState, pick = vi.fn(async (set: string) => state(set, true))) {
  const files: string[] = [];
  vi.stubGlobal('fetch', async (url: string) => {
    files.push(url);
    return new Response(null, { status: 404 });
  });
  // A browser with sound: the file is asked for, then nothing plays as it is missing.
  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'running';
      resume = async () => undefined;
    },
  );
  renderInShell(
    <ManagementScreen onBack={() => undefined} />,
    false,
    true,
    undefined,
    testClients({ sounds: { state: async () => loaded, pick } }),
  );
  return { pick, files };
}

describe('Ovozlar (G54, docs/115)', () => {
  it('shows the three sets with the one in use; the owner picks another', async () => {
    const { pick } = open(state('3', true));
    await tap('Ovozlar');
    expect(await screen.findByText('1-variant')).toBeTruthy();
    expect(screen.getAllByText('Tanlangan')).toHaveLength(1);
    await tap('1-variant');
    expect(pick).toHaveBeenCalledWith('1');
  });

  it('lets anyone of the team listen to a set; only the owner picks', async () => {
    const { pick, files } = open(state('3', false));
    await tap('Ovozlar');
    const rings = await screen.findAllByText('Qoʻngʻiroq');
    fireEvent.click(rings[1] ?? document.body);
    await waitFor(() => expect(files.at(-1)).toMatch(/sounds\/2-ring\.wav$/u));
    await tap('1-variant');
    expect(pick).not.toHaveBeenCalled();
  });
});
