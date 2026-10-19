import { fontStack, loadBrand } from '@platform/brands';
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { usePictureFont } from './picture-font';

const { font } = loadBrand().theme;
let pictureFont: () => Promise<string> = async () => '';
function Probe() {
  pictureFont = usePictureFont();
  return null;
}
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(document, 'fonts');
});

// G73: the pictures for friends (story, moment, QR, card) are in the font of the brand, as the screens.
describe('the font of a picture (G73)', () => {
  it('is the font of the brand, loaded in both weights before the canvas draws', async () => {
    const load = vi.fn(async () => []);
    Object.defineProperty(document, 'fonts', { value: { load }, configurable: true });
    renderInShell(<Probe />);
    expect(await pictureFont()).toBe(fontStack(font));
    expect(load.mock.calls).toEqual([[`400 16px "${font}"`], [`700 16px "${font}"`]]);
  });

  it('draws at once where the browser has no font list', async () => {
    renderInShell(<Probe />);
    expect(await pictureFont()).toBe(fontStack(font));
  });
});
