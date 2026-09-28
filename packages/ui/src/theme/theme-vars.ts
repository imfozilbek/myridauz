import type { BrandColors } from '@platform/brands';

// Brand colors replace only TelegramUI colors. Radii, spacing and fonts stay Telegram's (docs/19).
export function themeVars(colors: BrandColors): Record<string, string> {
  return {
    '--tgui--bg_color': colors.bg,
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
