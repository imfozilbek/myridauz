import { useLayoutEffect, useRef, type ReactNode } from 'react';

// How tall the trips block of the main screen was last time on this phone. While it loads again,
// its place is kept that tall, so the actions under it do not move when the trips come (G41, docs/108).
const KEY = 'home_top_height';

function remembered(): number {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

function remember(height: number) {
  try {
    localStorage.setItem(KEY, String(height));
  } catch {
    // No storage on this phone: the place is not kept, the trips still come.
  }
}

export function HomeTop({ children }: { readonly children: ReactNode }) {
  const block = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = block.current;
    if (!node) return;
    const height = remembered();
    node.style.setProperty('--home-top-height', `${height}px`);
    // The first time on this phone the height is not known: what is under the block waits the
    // short moment of the hidden gray rows, then comes together with the trips.
    if (height === 0) node.dataset['fresh'] = '';
    if (typeof ResizeObserver === 'undefined') return;
    // Only the real block is remembered, never the gray rows.
    const observer = new ResizeObserver(() => {
      if (!node.querySelector('[aria-busy="true"]'))
        remember(Math.round(node.getBoundingClientRect().height));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={block} className="home-top">
      {children}
    </div>
  );
}
