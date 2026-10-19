import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Styles follow the rule of code: at most 150 lines in a file (docs/11). ESLint reads no CSS, so three
// files grew past it in G61 and G63 unseen (lesson 170).
const MAX_LINES = 150;
const ROOTS = ['../apps/', '../packages/'].map((root) => new URL(root, import.meta.url));

const styles = (root) =>
  readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.css'))
    .filter((name) => !name.split('/').some((part) => part === 'node_modules' || part === 'dist'))
    .map((name) => new URL(name, root));

describe('style files', { timeout: 20_000 }, () => {
  it('keep every file within 150 lines', () => {
    const long = ROOTS.flatMap(styles)
      .filter((file) => readFileSync(file, 'utf8').trimEnd().split('\n').length > MAX_LINES)
      .map((file) => file.pathname);
    expect(long).toEqual([]);
  });

  // G73: the font is named once, in the theme of the brand; a style takes it from TelegramUI's variable
  // or its parent. Only the plate and the codes keep the even letters of a monospace font.
  it('name no font but the one of the brand', () => {
    const own = ROOTS.flatMap(styles).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/font-family:\s*([^;}]+)/g)]
        .map(([, value]) => value.trim())
        .filter((value) => !/^(var\(--tgui--font-family[),]|inherit$)|monospace$/.test(value))
        .map((value) => `${file.pathname}: ${value}`),
    );
    expect(own).toEqual([]);
  });

  // G73: code names no font either: the screens, the splash and the pictures take it from the brand.
  it('keep the code free of font names', () => {
    const code = ROOTS.flatMap((root) =>
      readdirSync(root, { recursive: true, encoding: 'utf8' })
        .filter((name) => /\.tsx?$/.test(name) && !/\.test\.tsx?$|node_modules|dist\//.test(name))
        .map((name) => new URL(name, root)),
    );
    const named = code.filter((file) => /sans-serif|system-ui|Roboto/.test(readFileSync(file, 'utf8')));
    expect(named.map((file) => file.pathname)).toEqual([]);
  });
});
