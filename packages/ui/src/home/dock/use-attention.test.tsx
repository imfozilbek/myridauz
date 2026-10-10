import type { PersonId } from '@platform/contracts';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeSheet, forgetSheets, openSheet, useActionItems } from '../../action-sheet/action-queue';
import type { ActionItem } from '../../action-sheet/action-item';
import { haptic } from '../../telegram/feedback';
import { useAttention, type Thing } from './use-attention';

const shake = vi.spyOn(haptic, 'attention');
afterEach(() => {
  shake.mockClear();
  forgetSheets();
});

const thing = (id: string, level: number, loud = true): Thing => ({ id, level, loud });
const follow = (first: Thing) => renderHook(({ now }) => useAttention(now), { initialProps: { now: first } });

describe('when the block calls the eye (G76, docs/165)', () => {
  it('calls for a new thing as important or more, once each, with one shake', () => {
    const { result, rerender } = follow(thing('request:r1', 7));
    expect(result.current).toBe(1);
    rerender({ now: thing('request:r1', 7) });
    expect(result.current).toBe(1);
    rerender({ now: thing('offers:r1', 4) });
    expect(result.current).toBe(2);
    expect(shake).toHaveBeenCalledTimes(2);
  });

  it('does not call again for the same thing when the block comes back after a section', () => {
    follow(thing('request:r1', 7)).unmount();
    const { result } = follow(thing('request:r1', 7));
    expect(result.current).toBe(0);
    expect(shake).toHaveBeenCalledOnce();
  });

  it('lets a less important thing or one without «Hozir» come quietly', () => {
    const { result, rerender } = follow(thing('driverWaits:b1', 1));
    rerender({ now: thing('offers:r1', 4) });
    rerender({ now: thing('confirmed:b2', 6, false) });
    expect(result.current).toBe(1);
  });

  it('waits while a sheet stands, then calls', () => {
    const face = { id: 'p1' as PersonId, name: 'Madina', hasAvatar: false };
    const main = { label: 'Tasdiqlash', run: () => undefined };
    const item: ActionItem = { key: 'request:b1', kind: 'request', face, kicker: '', title: '', main };
    renderHook(() => useActionItems('test', [item]));
    act(() => openSheet('request'));
    const { result, rerender } = follow(thing('idle::', 10, false));
    rerender({ now: thing('requests:t1', 4) });
    expect(result.current).toBe(0);
    act(closeSheet);
    expect(result.current).toBe(1);
  });
});
