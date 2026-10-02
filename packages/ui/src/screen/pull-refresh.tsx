import { useEffect, useRef, useState } from 'react';
import { Spinner } from '../components';
import { haptic } from '../telegram/feedback';
import './screen.css';

// Far enough down, the list refreshes; the circle follows the finger at half its way.
const PULL_PX = 72;
const MAX_PX = 96;

// A pull down at the very top of a list refreshes it (owner's decision 02.10.2026, docs/94 W1).
// The swipe that closes Telegram stays off, so the same move never closes the app.
export function PullRefresh({ onRefresh }: { readonly onRefresh: () => unknown }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const refresh = useRef(onRefresh);
  refresh.current = onRefresh;
  useEffect(() => {
    let start: number | null = null;
    let way = 0;
    const down = (event: TouchEvent) => {
      start = window.scrollY <= 0 ? (event.touches[0]?.clientY ?? null) : null;
      way = 0;
    };
    const move = (event: TouchEvent) => {
      if (start === null) return;
      way = Math.max(0, (event.touches[0]?.clientY ?? start) - start);
      setPull(Math.min(way / 2, MAX_PX));
    };
    const up = () => {
      const far = start !== null && way / 2 >= PULL_PX;
      start = null;
      setPull(0);
      if (!far) return;
      haptic.tap();
      setBusy(true);
      void Promise.resolve(refresh.current()).finally(() => setBusy(false));
    };
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, []);
  if (!busy && pull === 0) return null;
  return (
    <div className="pull-refresh" style={{ transform: `translateY(${busy ? PULL_PX / 2 : pull / 2}px)` }}>
      <Spinner size="s" />
    </div>
  );
}
