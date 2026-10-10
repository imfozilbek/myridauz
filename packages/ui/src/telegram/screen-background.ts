import type { HexColor } from '@platform/brands';
import { useLayoutEffect } from 'react';
import { useBrand } from '../context/brand-context';
import { paintScreen } from './chrome';
import { useBehind } from './behind';
import { useInTelegram } from './in-telegram-context';

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

// Every screen of the three Mini App: the light color of the app on top, fading into the grouped gray
// (docs/121 §5, G72). Telegram paints its header in the top and its bottom bar in the bottom, so they look
// like one surface (docs/21). Set before the first paint: no frame of the last screen's color (G41).
// A screen with its own white head (the chat, mockup g60/2) has a white Telegram header over it: one
// surface, no seam between the tint and the head.
export function useScreenBackground(head?: 'white'): void {
  const inTelegram = useInTelegram();
  const behind = useBehind();
  const { colors } = useBrand().theme;
  const bottom = colors.bgGrouped;
  const top = tint(colors.brandStrong);
  const header = head === 'white' ? colors.bg : top;
  useLayoutEffect(() => {
    if (behind) return;
    document.body.style.background = `linear-gradient(${top}, ${bottom} ${FADE_END}) ${bottom}`;
    if (inTelegram) paintScreen({ header, bottom });
  }, [inTelegram, behind, header, top, bottom]);
}

// The white bottom bar under the route block of the main screen (G66, mockups g66/1, g66/2): the white
// panel and the Telegram button look like one sheet. The block paints after the screen and gives the
// gray back when it leaves (the day of a trip shows the button alone on the gray, mockup g66/2 screen 4).
export function useWhiteBottomBar(): void {
  const inTelegram = useInTelegram();
  const behind = useBehind();
  const { colors } = useBrand().theme;
  const header = tint(colors.brandStrong);
  const { bg, bgGrouped } = colors;
  useLayoutEffect(() => {
    if (!inTelegram || behind) return undefined;
    paintScreen({ header, bottom: bg });
    return () => paintScreen({ header, bottom: bgGrouped });
  }, [inTelegram, behind, header, bg, bgGrouped]);
}
