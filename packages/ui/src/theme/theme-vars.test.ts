import { fontStack, loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { themeVars } from './theme-vars';

const { theme } = loadBrand();
const { colors } = theme;

describe('themeVars', () => {
  it('uses brand colors for TelegramUI in a light theme', () => {
    const vars = themeVars(theme);
    expect(vars['--tgui--bg_color']).toBe(colors.bg);
    expect(vars['--tgui--button_color']).toBe(colors.brandStrong);
    expect(vars['--tgui--button_text_color']).toBe(colors.bg);
    expect(vars['--tgui--text_color']).toBe(colors.text);
    expect(vars['--tgui--link_color']).toBe(colors.brandText);
  });

  // G73: every screen in the font of the brand, the font of the phone behind it.
  it('changes the colors and the font, never radii or spacing', () => {
    const vars = themeVars({ ...theme, font: 'other-font' });
    expect(vars['--tgui--font-family']).toBe(fontStack('other-font'));
    const rest = Object.keys(vars).filter((name) => name !== '--tgui--font-family');
    expect(rest.every((name) => name.endsWith('_color'))).toBe(true);
  });
});
