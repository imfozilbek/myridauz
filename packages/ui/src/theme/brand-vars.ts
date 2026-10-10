import type { BrandColors } from '@platform/brands';
import type { CSSProperties } from 'react';

// The colors of the app as CSS variables: the screens drawn by the values of their approved mockups
// (Pixel Perfect, lesson 141) take only the colors from the brand (docs/22).
export const brandVars = (colors: BrandColors) =>
  ({
    '--reg-brand': colors.brand,
    '--reg-strong': colors.brandStrong,
    '--reg-text': colors.brandText,
    '--reg-soft': colors.brandSoft,
    '--reg-mint': colors.brandMint,
    '--reg-line': colors.brandLine,
    '--reg-deep': colors.brandDeep,
    '--reg-ink': colors.text,
    '--reg-muted': colors.textMuted,
    '--reg-secondary': colors.textSecondary,
    '--reg-bg': colors.bgGrouped,
    '--reg-card': colors.bg,
    '--reg-divider': colors.divider,
    '--reg-control': colors.control,
    '--reg-from': colors.routeFrom,
    '--reg-to': colors.routeTo,
    '--reg-route-line': colors.routeLine,
    '--reg-accent': colors.accentStrong,
    '--reg-accent-soft': colors.accentSoft,
    '--reg-accent-deep': colors.accentDeep,
    '--reg-card-line': colors.cardLine,
    '--reg-star': colors.accent,
    '--reg-face': colors.neutralFace,
    '--reg-face-pale': colors.neutralFacePale,
    '--reg-neutral-pale': colors.neutralPale,
    '--reg-neutral-pale-text': colors.neutralPaleText,
    '--reg-face-text': colors.neutralText,
    '--reg-off': colors.disabled,
    '--reg-success': colors.success,
    '--reg-success-soft': colors.successSoft,
    '--reg-success-pale': colors.successPale,
    '--reg-success-line': colors.successLine,
    '--reg-success-deep': colors.successDeep,
    // The tick of «{name} keldi» on the dark plate of «Uchrashuv» (G63, mockup g63/4 screen 13).
    '--reg-success-bright': colors.successBright,
    '--reg-attention': colors.attention,
    '--reg-attention-soft': colors.attentionSoft,
    '--reg-attention-line': colors.attentionLine,
    // What a deletion removes and the wallet it takes (G75, mockup g75/5 A).
    '--reg-attention-ink': colors.attentionInk,
    '--reg-danger-tile': colors.dangerTile,
    '--reg-night': colors.neutralNight,
    // The icon tile of a row of the mockups g75/6 A: the strong light color of each app.
    '--reg-tile': colors.stateTile,
    // «Kelmadi» of a passenger on the screens of the driver (G63, mockup g63/5).
    '--reg-danger-text': colors.dangerText,
    // «Rad etish» of a call in the sheet of the open Mini App (G68, mockup g68/8).
    '--reg-danger': colors.danger,
    // The numbers of the chips of «Navbat» and their gray icon tiles (G75, mockup g67/1).
    '--reg-danger-line': colors.dangerLine,
    '--reg-neutral-soft': colors.neutralSoft,
    // The warning of a case and the photo places of an application (G75, mockup g67/2).
    '--reg-warning': colors.warning,
    '--reg-warning-text': colors.warningText,
    '--reg-warning-soft': colors.warningSoft,
    '--reg-warning-line': colors.warningLine,
  }) as CSSProperties;
