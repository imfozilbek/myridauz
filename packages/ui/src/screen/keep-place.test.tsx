import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useKeepPlace } from './keep-place';

const ROW_PX = 100;
afterEach(cleanup);

// Rows stand one under another, the page scrolled down by 250 px.
function Rows({ ids }: { readonly ids: readonly string[] }) {
  useKeepPlace(ids);
  return (
    <>
      {ids.map((id) => (
        <div key={id} data-row={id} />
      ))}
    </>
  );
}

describe('a quiet refresh keeps the row under the finger (docs/94 S3)', () => {
  it('a row above disappears: the page moves so the same row stays in place', () => {
    Object.defineProperty(window, 'scrollY', { value: 250, configurable: true });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const index = [...document.querySelectorAll('[data-row]')].indexOf(this);
      const top = index * ROW_PX - 250;
      return { top, bottom: top + ROW_PX } as DOMRect;
    });
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    const { rerender } = render(<Rows ids={['a', 'b', 'c', 'd', 'e']} />);
    // c is the first row on the screen (top -50 → bottom 50); a is gone after the refresh.
    rerender(<Rows ids={['b', 'c', 'd', 'e']} />);
    expect(scrollBy).toHaveBeenCalledWith(0, -ROW_PX);
  });
});
