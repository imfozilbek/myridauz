import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Behind } from '../telegram/behind';
import { useFreshLists } from './fresh-lists';

let behind = false;
const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <Behind.Provider value={behind}>{children}</Behind.Provider>
);
const lists = (value: unknown = [], failed = false) => ({
  value,
  failed,
  refresh: vi.fn(async () => undefined),
  reload: vi.fn(),
});

beforeEach(() => void (behind = false));

// The lists of the main screen read by a screen (G77, lessons 230, 236).
describe('useFreshLists', () => {
  // An offer answered in a chat or a call over the app: no signal comes for the person's own step.
  it('refreshes the lists again once a screen over this one closes', () => {
    const shared = lists();
    const { rerender } = renderHook(() => useFreshLists(shared), { wrapper });
    expect(shared.refresh).toHaveBeenCalledTimes(1);
    behind = true;
    rerender();
    expect(shared.refresh).toHaveBeenCalledTimes(1);
    behind = false;
    rerender();
    expect(shared.refresh).toHaveBeenCalledTimes(2);
  });

  it('loads again a first load that failed, as a screen with its own lists did', () => {
    const shared = lists(null, true);
    renderHook(() => useFreshLists(shared), { wrapper });
    expect(shared.reload).toHaveBeenCalledOnce();
    expect(shared.refresh).not.toHaveBeenCalled();
  });
});
