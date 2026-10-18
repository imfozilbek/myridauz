import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COMBOS } from './palette.mjs';
import { botWelcome, WELCOMES, welcomeVersion } from './welcome.mjs';

const versions = JSON.parse(fs.readFileSync(new URL('../../welcomes.json', import.meta.url), 'utf8'));
// The logo in the corner of a welcome: the tile of 160 and the R drawn right after it.
const LOGO = /<rect x="80" y="80" width="160" height="160" rx="[\d.]+" fill="(#[0-9A-F]{6})"\/><path d="[^"]+" fill="(#[0-9A-F]{6})"\/>/u;

describe('the welcome of a bot', () => {
  // docs/36: a combo of the table only, the one that stands out of the color of the bot (lesson №312).
  it.each([
    ['passenger', 2],
    ['driver', 5],
    ['support', 1],
  ])('of the %s wears the logo in combo %i', (role, combo) => {
    const [, bg, fg] = botWelcome(role).match(LOGO) ?? [];
    expect({ bg, fg }).toEqual(COMBOS[combo]);
  });

  // Telegram keeps a picture by its address: the bots send it under the version of its drawing (lesson №311).
  it('goes under the version of its drawing, rendered by pnpm bot', () => {
    expect(Object.fromEntries(WELCOMES.map((role) => [role, welcomeVersion(botWelcome(role))]))).toEqual(versions);
  });
});
