import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { MainButton } from './bottom-button';

afterEach(cleanup);

describe('the main button runs its action once at a time (docs/65 A4)', () => {
  it('ignores a second tap while publishing, and takes taps again when it ended', async () => {
    let finish: () => void = () => undefined;
    const publish = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    renderInShell(<MainButton text="Eʼlon qilish" onClick={publish} />);
    const button = screen.getByText('Eʼlon qilish');
    fireEvent.click(button);
    fireEvent.click(button);
    expect(publish).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    fireEvent.click(screen.getByText('Eʼlon qilish'));
    expect(publish).toHaveBeenCalledTimes(2);
  });
});
