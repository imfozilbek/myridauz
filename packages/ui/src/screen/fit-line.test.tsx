import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFitLine } from './fit-line';

// A line of 20 px words that need 10 px of width for each px of their size: 200 px.
const MOCKUP = 20;
const WIDTH_PER_PX = 10;
const WORDS = 'Ҳаволани йўловчиларга юбориш';

function Line() {
  const ref = useFitLine<HTMLSpanElement>(WORDS);
  return <span ref={ref}>{WORDS}</span>;
}

const sizeOf = (element: Element) =>
  element instanceof HTMLElement && element.style.fontSize
    ? Number.parseFloat(element.style.fontSize)
    : MOCKUP;

function phone(room: number) {
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(room);
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function width(this: Element) {
    return sizeOf(this) * WIDTH_PER_PX;
  });
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    (element) => ({ fontSize: `${sizeOf(element)}px` }) as CSSStyleDeclaration,
  );
}

describe('one line that is never cut (docs/121, G98)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('makes the words smaller only as much as their room asks', () => {
    phone(150);
    render(<Line />);
    expect(screen.getByText(WORDS).style.fontSize).toBe('15px');
  });

  it('keeps the size of the mockup when the words fit', () => {
    phone(300);
    render(<Line />);
    expect(screen.getByText(WORDS).style.fontSize).toBe('');
  });
});
