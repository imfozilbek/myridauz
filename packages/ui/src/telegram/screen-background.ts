import type { HexColor } from '@platform/brands';
import { miniApp } from '@telegram-apps/sdk-react';
import { useLayoutEffect } from 'react';
import { useBrand } from '../context/brand-context';
import { useInTelegram } from './in-telegram-context';

// tinted: the light color of the Mini App on top, fading into the grouped background (docs/121 §5).
export type ScreenBackground = 'plain' | 'grouped' | 'tinted';

// The top of the gradient: the color of the app mixed only with white, never with gray (docs/121 §5).
const TINT = 0.09;
const FADE_END = '55vh';
const WHITE = 255;
const HEX = 16;
function tint(color: HexColor, share: number = TINT): HexColor {
  const channel = (start: number) => {
    const mixed = Math.round(share * parseInt(color.slice(start, start + 2), HEX) + (1 - share) * WHITE);
    return mixed.toString(HEX).padStart(2, '0');
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`.toUpperCase() as HexColor;
}

// Telegram paints its header and bottom bar in the color of the screen, so they look like one surface (docs/21).
// Set before the first paint: the screen never shows the color of the last one for a frame (G41).
export function useScreenBackground(background: ScreenBackground): void {
  const inTelegram = useInTelegram();
  const { colors } = useBrand().theme;
  const bottom = background === 'plain' ? colors.bg : colors.bgGrouped;
  const top = background === 'tinted' ? tint(colors.brandStrong) : bottom;
  useLayoutEffect(() => {
    document.body.style.background =
      top === bottom ? bottom : `linear-gradient(${top}, ${bottom} ${FADE_END}) ${bottom}`;
    if (!inTelegram) return;
    miniApp.setHeaderColor.ifAvailable(top);
    miniApp.setBackgroundColor.ifAvailable(bottom);
    miniApp.setBottomBarColor.ifAvailable(bottom);
  }, [inTelegram, top, bottom]);
}
