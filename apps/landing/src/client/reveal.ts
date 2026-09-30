// Cards appear softly when they come into view; the two buttons stick to the bottom of a phone
// after the first screen. Nothing moves for people who asked for less motion.
export function initReveal(doc: Document) {
  const items = [...doc.querySelectorAll<HTMLElement>('.reveal')];
  const sticky = doc.querySelector<HTMLElement>('[data-sticky]');
  const hero = doc.querySelector<HTMLElement>('.hero');
  if (!('IntersectionObserver' in window)) {
    for (const item of items) item.classList.add('in');
    return;
  }
  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      reveal.unobserve(entry.target);
    }
  });
  for (const item of items) reveal.observe(item);
  if (!sticky || !hero) return;
  new IntersectionObserver(([entry]) => sticky.classList.toggle('on', !entry?.isIntersecting)).observe(hero);
}
