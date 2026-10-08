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
    '--reg-bg': colors.bgGrouped,
    '--reg-card': colors.bg,
    '--reg-divider': colors.divider,
    '--reg-control': colors.control,
    '--reg-from': colors.routeFrom,
    '--reg-to': colors.routeTo,
    '--reg-route-line': colors.routeLine,
    '--reg-accent': colors.accentStrong,
    '--reg-accent-soft': colors.accentSoft,
    '--reg-star': colors.accent,
    '--reg-face': colors.neutralFace,
    '--reg-face-pale': colors.neutralFacePale,
    '--reg-face-text': colors.neutralText,
    '--reg-off': colors.disabled,
    '--reg-success': colors.success,
    '--reg-success-soft': colors.successSoft,
    '--reg-success-pale': colors.successPale,
    '--reg-success-line': colors.successLine,
    '--reg-success-deep': colors.successDeep,
    '--reg-attention': colors.attention,
    '--reg-attention-soft': colors.attentionSoft,
  }) as CSSProperties;
