import { fontStack, type BrandConfig } from '@platform/brands';

// The colors and the font of the brand replace those of TelegramUI (G73, docs/22). Radii and spacing
// stay Telegram's (docs/19).
export function themeVars({ colors, font }: BrandConfig['theme']): Record<string, string> {
  return {
    '--tgui--font-family': fontStack(font),
    '--tgui--bg_color': colors.bg,
    '--tgui--secondary_bg_color': colors.bgGrouped,
    '--tgui--header_bg_color': colors.bg,
    '--tgui--section_bg_color': colors.bg,
    '--tgui--text_color': colors.text,
    '--tgui--hint_color': colors.textMuted,
    '--tgui--subtitle_text_color': colors.textMuted,
    '--tgui--section_header_text_color': colors.textMuted,
    '--tgui--link_color': colors.brandText,
    '--tgui--accent_text_color': colors.brandText,
    '--tgui--button_color': colors.brandStrong,
    '--tgui--button_text_color': colors.bg,
    '--tgui--destructive_text_color': colors.danger,
  };
}
