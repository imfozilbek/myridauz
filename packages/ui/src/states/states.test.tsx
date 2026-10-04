import { act, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useScreenView } from '../context/analytics-context';
import { renderInShell } from '../test-shell';
import { ErrorBoundary } from './error-boundary';
import { ScreenSkeleton } from './screen-skeleton';

function Broken(): never {
  throw new Error('boom');
}

describe('screen states', () => {
  it('shows a friendly error, reports it and lets the person retry', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { tracked } = renderInShell(<Broken />);
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
    // What broke and where, sent at once (G52, docs/112).
    expect(tracked).toEqual([
      {
        name: 'client_error',
        screen: 'app',
        code: 'render',
        error: 'Error',
        detail: 'boom',
        client: 'browser',
      },
    ]);
    fireEvent.click(screen.getByText('Qayta urinish'));
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
  });

  it('names the screen that broke and lets a section go back while the rest works (G52)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const back = vi.fn();
    function Home() {
      useScreenView('home');
      const [broken, setBroken] = useState(false);
      return broken ? <Broken /> : <button onClick={() => setBroken(true)}>buzish</button>;
    }
    const { tracked } = renderInShell(
      <>
        <p>tirik</p>
        <ErrorBoundary onBack={back}>
          <Home />
        </ErrorBoundary>
      </>,
    );
    fireEvent.click(screen.getByText('buzish'));
    expect(tracked.at(-1)).toMatchObject({ name: 'client_error', screen: 'home', detail: 'boom' });
    expect(screen.getByText('tirik')).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(back).toHaveBeenCalledOnce();
  });

  it('shows skeletons while loading', () => {
    const { container } = renderInShell(<ScreenSkeleton />);
    expect(container.querySelector('[aria-busy="true"]')?.children).toHaveLength(4);
  });

  it('keeps the place of a skeleton at once and shows it only after a noticeable wait (G41)', () => {
    vi.useFakeTimers();
    const { container } = renderInShell(<ScreenSkeleton />);
    const skeleton = container.querySelector('[aria-busy="true"]');
    expect(skeleton?.hasAttribute('data-hidden')).toBe(true);
    act(() => vi.advanceTimersByTime(300));
    expect(skeleton?.hasAttribute('data-hidden')).toBe(false);
    vi.useRealTimers();
  });

  it('keeps "back" while an inner screen loads (docs/65 B1)', () => {
    const onBack = vi.fn();
    renderInShell(<ScreenSkeleton onBack={onBack} />);
    fireEvent.click(screen.getByText('Orqaga'));
    expect(onBack).toHaveBeenCalled();
  });
});
