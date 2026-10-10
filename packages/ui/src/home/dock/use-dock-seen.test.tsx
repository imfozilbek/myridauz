import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../../test-shell';
import { useDockSeen } from './use-dock-seen';

afterEach(cleanup);

function Block() {
  const [state, setState] = useState<'idle' | 'request'>('idle');
  useDockSeen(state);
  return (
    <button type="button" onClick={() => setState('request')}>
      request
    </button>
  );
}

describe('the state of the block in the analytics (G76, docs/29)', () => {
  it('is counted once when it changes, not again when the block comes back after a section', () => {
    const first = renderInShell(<Block />);
    first.unmount();
    const again = renderInShell(<Block />);
    act(() => void fireEvent.click(screen.getByText('request')));
    const counted = [...first.tracked, ...again.tracked].filter((event) => event.name === 'dock_state');
    expect(counted.map((event) => ('state' in event ? event.state : null))).toEqual(['idle', 'request']);
  });
});
