const STEP_MS = 3500;

// "Qanday ishlaydi": the tabs switch the side, a step shows its screen in the phone. The steps
// play by themselves until the person taps something.
export function initHow(root: HTMLElement, auto = true) {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-tab]')];
  const paths = [...root.querySelectorAll<HTMLElement>('[data-path]')];
  let timer = 0;
  const current = () => paths.find((path) => path.classList.contains('shown')) ?? paths[0];

  const showStep = (path: HTMLElement, index: number) => {
    const steps = [...path.querySelectorAll<HTMLElement>('[data-step]')];
    const screens = [...path.querySelectorAll<HTMLElement>('.screen')];
    steps.forEach((step, i) => step.classList.toggle('active', i === index));
    screens.forEach((screen, i) => screen.classList.toggle('shown', i === index));
  };
  const showTab = (role: string) => {
    for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset['tab'] === role));
    for (const path of paths) path.classList.toggle('shown', path.dataset['path'] === role);
    const path = current();
    if (path) showStep(path, 0);
  };
  const stop = () => window.clearInterval(timer);

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      stop();
      showTab(tab.dataset['tab'] ?? '');
    });
  }
  for (const path of paths) {
    path.querySelectorAll<HTMLElement>('[data-step]').forEach((step, index) =>
      step.querySelector('button')?.addEventListener('click', () => {
        stop();
        showStep(path, index);
      }),
    );
  }
  if (!auto) return;
  timer = window.setInterval(() => {
    const path = current();
    if (!path) return;
    const steps = path.querySelectorAll('[data-step]');
    const active = [...steps].findIndex((step) => step.classList.contains('active'));
    showStep(path, (active + 1) % steps.length);
  }, STEP_MS);
}
