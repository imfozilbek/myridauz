import { act, fireEvent } from '@testing-library/react';

// Test helper for lists (docs/94): the page scrolled to y, a long pull down at the top of a list.
export const scrolledTo = (y: number) =>
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });

const touch = (type: string, clientY: number) =>
  fireEvent(window, Object.assign(new Event(type), { touches: [{ clientY }] }));

export async function pullDown() {
  scrolledTo(0);
  touch('touchstart', 100);
  touch('touchmove', 400);
  await act(async () => touch('touchend', 400));
}

// A skeleton is on the screen while a list loads loudly.
export const skeleton = () => document.querySelector('[aria-busy="true"]');

// The rows a quiet refresh keeps under the finger (docs/94 S3).
export const rows = () =>
  [...document.querySelectorAll<HTMLElement>('[data-row]')].map((row) => row.dataset['row']);
