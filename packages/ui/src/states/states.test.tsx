import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { ScreenSkeleton } from './screen-skeleton';

function Broken(): never {
  throw new Error('boom');
}

describe('screen states', () => {
  it('shows a friendly error, reports it and lets the person retry', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { tracked } = renderInShell(<Broken />);
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
    expect(tracked).toEqual([{ name: 'client_error', screen: 'app', code: 'render' }]);
    fireEvent.click(screen.getByText('Qayta urinish'));
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
  });

  it('shows skeletons while loading', () => {
    const { container } = renderInShell(<ScreenSkeleton />);
    expect(container.querySelector('[aria-busy="true"]')?.children).toHaveLength(4);
  });
});
