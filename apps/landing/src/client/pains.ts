type Side = 'before' | 'after';
const SHOW_AFTER_MS = 1600;

// "Oldin" and "Rida bilan": the switch shows one side. When the section comes into view the
// old way shows first, then turns into the new way once by itself.
export function initPains(root: HTMLElement, auto = true) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-side-to]')];
  const show = (side: Side) => {
    root.dataset['side'] = side;
    for (const button of buttons)
      button.setAttribute('aria-pressed', String(button.dataset['sideTo'] === side));
  };
  let touched = false;
  for (const button of buttons) {
    button.addEventListener('click', () => {
      touched = true;
      show(button.dataset['sideTo'] === 'after' ? 'after' : 'before');
    });
  }
  show('before');
  if (!auto || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    window.setTimeout(() => touched || show('after'), SHOW_AFTER_MS);
  });
  observer.observe(root);
}
