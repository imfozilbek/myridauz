import { afterEach, describe, expect, it } from 'vitest';
import { loadBrand } from '../brands/index.ts';
import miniApp from '../packages/config/vite.config.js';

const { id } = loadBrand();
const before = process.env.VITE_ENVIRONMENT;
// The splash the build puts into index.html (docs/121 §4).
const indexBy = (name) =>
  miniApp('passenger')
    .plugins.flat()
    .find((plugin) => plugin?.name === name)
    .transformIndexHtml('<head></head><body></body>');
const splashOf = () => indexBy('splash');

// docs/179: a Mini App of the team says the name of the team environment from its first frame.
describe('the build of a Mini App', () => {
  afterEach(() => {
    if (before === undefined) delete process.env.VITE_ENVIRONMENT;
    else process.env.VITE_ENVIRONMENT = before;
  });

  it('shows the name of its environment on the splash', () => {
    process.env.VITE_ENVIRONMENT = 'internal';
    expect(splashOf()).toContain(`>${loadBrand(id, 'internal').name}</b>`);
  });

  it('builds production when no environment is named', () => {
    delete process.env.VITE_ENVIRONMENT;
    expect(splashOf()).toContain(`>${loadBrand(id, 'production').name}</b>`);
  });

  // G73: the font of the brand comes with the page: its faces and the Latin files asked for at once.
  it('puts the font of the brand into the head', () => {
    const { theme } = loadBrand();
    const head = indexBy('font');
    expect(head).toContain(`<link rel="preload" href="/fonts/${theme.font}/regular-latin.woff2"`);
    expect(head).toContain(`@font-face{font-family:"${theme.font}"`);
    expect(head.indexOf('@font-face')).toBeLessThan(head.indexOf('</head>'));
  });
});
