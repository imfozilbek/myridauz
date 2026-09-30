const DURATION = 1200;

// The numbers count up from zero once, when they come into view (docs/60). The page already shows
// the real numbers without the script; with less motion nothing moves.
export function initCount(doc: Document, moving: boolean) {
  const items = [...doc.querySelectorAll<HTMLElement>('[data-count-up]')];
  if (!moving || !('IntersectionObserver' in window)) return;
  const run = (item: HTMLElement) => {
    const target = Number(item.dataset['countUp']);
    const start = performance.now();
    const step = (now: number) => {
      const done = Math.min(1, (now - start) / DURATION);
      item.textContent = String(Math.round(target * (1 - (1 - done) ** 3)));
      if (done < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const watch = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      watch.unobserve(entry.target);
      run(entry.target as HTMLElement);
    }
  });
  for (const item of items) watch.observe(item);
}
