import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const logo = (code) => new URL(`../../public/channels/${code}.webp`, import.meta.url);

// The app shows the logo each channel has in Telegram (owner decision 13.10.2026, docs/176): the
// avatar of its region, made by pnpm logos. Without the file a channel would show an empty circle.
describe('the logos of the channels', () => {
  it('are made for the region of every channel of the brand', () => {
    const missing = read('../../channels.json').filter(({ code }) => !fs.existsSync(logo(code)));
    expect(missing).toEqual([]);
  });

  it('are made from the regions of the kit, one a region', () => {
    expect(read('../data/regions.json').every(({ code }) => fs.existsSync(logo(code)))).toBe(true);
  });
});
