import { expect, type Page } from '@playwright/test';
import { afterSplash } from '../crash-guard';

// Every screen of the three Mini App shows the gradient of docs/121 §5 (G72): the body paints it and
// nothing above it paints its own background at the top left corner of the screen. The chat keeps its
// white head of mockup g60/2 under a white Telegram header (docs/135).
const OWN_HEADS = ['chat-top'];
export async function expectGradient(page: Page, name: string) {
  await afterSplash(page);
  const found = await page.evaluate((heads) => {
    if (!document.body.style.background.includes('linear-gradient')) return 'body without a gradient';
    const painted = document.elementsFromPoint(1, 1).find((element) => {
      if (element === document.body || element === document.documentElement) return false;
      if (heads.some((head) => element.classList.contains(head))) return false;
      const style = getComputedStyle(element);
      const transparent =
        style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent';
      return !transparent || style.backgroundImage !== 'none';
    });
    return painted ? `${painted.tagName}.${painted.className}` : null;
  }, OWN_HEADS);
  expect.soft(found, `${name}: the top of the screen covers the gradient`).toBeNull();
}
