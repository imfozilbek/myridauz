import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { themeVars } from './theme-vars';

const { colors } = loadBrand().theme;

describe('themeVars', () => {
  it('uses brand colors for TelegramUI in a light theme', () => {
    const vars = themeVars(colors);
    expect(vars['--tgui--bg_color']).toBe(colors.bg);
    expect(vars['--tgui--button_color']).toBe(colors.brandStrong);
    expect(vars['--tgui--button_text_color']).toBe(colors.bg);
    expect(vars['--tgui--text_color']).toBe(colors.text);
    expect(vars['--tgui--link_color']).toBe(colors.brandText);
  });

  it('changes only colors, never radii, spacing or fonts', () => {
    expect(Object.keys(themeVars(colors)).every((name) => name.endsWith('_color'))).toBe(true);
  });
});
