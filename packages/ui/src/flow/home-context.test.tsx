import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SentScreen } from '../feedback/sent-screen';
import { renderInShell } from '../test-shell';
import { HomeProvider } from './home-context';

afterEach(cleanup);

const sent = (onBack: () => void) => (
  <SentScreen icon="selected" title="Yuborildi" description="Rahmat" onBack={onBack} />
);

// G38 (owner decision 03.10.2026, docs/103): after a finished action «Назад» leads to the main
// screen, never back into the steps of the wizard.
describe('a finished action', () => {
  it('goes to the main screen when the app has one', () => {
    const home = vi.fn();
    const onBack = vi.fn();
    renderInShell(<HomeProvider value={home}>{sent(onBack)}</HomeProvider>);
    fireEvent.click(screen.getByText('Orqaga'));
    expect(home).toHaveBeenCalledOnce();
    expect(onBack).not.toHaveBeenCalled();
  });

  it('keeps its own way back outside the main screen', () => {
    const onBack = vi.fn();
    renderInShell(sent(onBack));
    fireEvent.click(screen.getByText('Orqaga'));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
