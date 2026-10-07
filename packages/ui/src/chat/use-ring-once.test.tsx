import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRingOnce } from './use-ring-once';

describe('«Qoʻngʻiroq» of the booking page (G60, mockup g60/1)', () => {
  it('rings once, only when the chat allows a call', () => {
    const ring = vi.fn(async () => undefined);
    const { rerender } = renderHook(({ may }) => useRingOnce(may, ring), { initialProps: { may: false } });
    expect(ring).not.toHaveBeenCalled();
    rerender({ may: true });
    rerender({ may: false });
    rerender({ may: true });
    expect(ring).toHaveBeenCalledTimes(1);
  });
});
