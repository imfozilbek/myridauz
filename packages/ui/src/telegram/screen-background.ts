import { miniApp } from '@telegram-apps/sdk-react';
import { useLayoutEffect } from 'react';
import { useBrand } from '../context/brand-context';
import { useInTelegram } from './in-telegram-context';

export type ScreenBackground = 'plain' | 'grouped';

// Telegram paints its header and bottom bar in the color of the screen, so they look like one surface (docs/21).
// Set before the first paint: the screen never shows the color of the last one for a frame (G41).
export function useScreenBackground(background: ScreenBackground): void {
  const inTelegram = useInTelegram();
  const { colors } = useBrand().theme;
  const color = background === 'grouped' ? colors.bgGrouped : colors.bg;
  useLayoutEffect(() => {
    document.body.style.background = color;
    if (!inTelegram) return;
    miniApp.setHeaderColor.ifAvailable(color);
    miniApp.setBackgroundColor.ifAvailable(color);
    miniApp.setBottomBarColor.ifAvailable(color);
  }, [inTelegram, color]);
}
