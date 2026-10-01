import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { MainButton } from './bottom-button';

const sdk = vi.hoisted(() => {
  const listeners: (() => void)[] = [];
  return {
    listeners,
    mainButton: {
      setParams: { ifAvailable: vi.fn(() => [true] as const) },
      onClick: {
        ifAvailable: vi.fn((listener: () => void) => {
          listeners.push(listener);
          return [true, () => undefined] as const;
        }),
      },
    },
  };
});
vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  mainButton: sdk.mainButton,
}));

describe('the native main button', () => {
  it('stays on screen when the screen renders again and runs the latest action', () => {
    const first = vi.fn();
    const second = vi.fn();
    function Screen() {
      const [later, setLater] = useState(false);
      return (
        <>
          <MainButton text="Safar topish" onClick={later ? second : first} />
          <button onClick={() => setLater(true)}>yana</button>
        </>
      );
    }
    renderInShell(<Screen />, true);
    sdk.mainButton.setParams.ifAvailable.mockClear();
    fireEvent.click(screen.getByText('yana'));
    expect(sdk.mainButton.setParams.ifAvailable).not.toHaveBeenCalledWith({ isVisible: false });
    sdk.listeners.at(-1)?.();
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });
});
