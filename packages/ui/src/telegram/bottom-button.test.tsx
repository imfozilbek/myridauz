import { act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { native } from '../test-native';
import { renderInShell } from '../test-shell';
import { MainButton } from './bottom-button';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
afterEach(() => vi.useRealTimers());

describe('the main button of Telegram between steps (G41, docs/108 E)', () => {
  it('stays shown when the next step takes it in the same moment; hides when nobody does', () => {
    vi.useFakeTimers();
    const step = renderInShell(<MainButton text="Davom etish" onClick={() => undefined} />, true);
    step.unmount();
    const next = renderInShell(<MainButton text="Eʼlon qilish" onClick={() => undefined} />, true);
    act(() => vi.runAllTimers());
    expect(native.mainShown).toBe(true);
    next.unmount();
    act(() => vi.runAllTimers());
    expect(native.mainShown).toBe(false);
  });
});
