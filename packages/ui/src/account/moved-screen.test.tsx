import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrandContext } from '../context/brand-context';
import { renderInShell } from '../test-shell';
import { MovedScreen } from './moved-screen';

afterEach(cleanup);

// Owner, 17.10.2026: the button opens the same Mini App of production.
describe('the way out of the internal environment', () => {
  it('opens the bot of production of the same Mini App', () => {
    renderInShell(
      <BrandContext.Provider value={loadBrand(loadBrand().id, 'internal')}>
        <MovedScreen app="driver" />
      </BrandContext.Provider>,
    );
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(screen.getByText('Yangi botni ochish'));
    expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${loadBrand().bots.driver}`);
    open.mockRestore();
  });
});
