import type { HexColor } from '@platform/brands';
import { mainButton, secondaryButton } from '@telegram-apps/sdk-react';
import { useEffect } from 'react';
import { Button } from '../components';
import { useBrand } from '../context/brand-context';
import { useInTelegram } from './in-telegram-context';
import { useOneAtATime } from './one-at-a-time';

type NativeParams = {
  text: string;
  isVisible: boolean;
  isLoaderVisible: boolean;
  isEnabled: boolean;
  backgroundColor?: HexColor;
  textColor?: HexColor;
};
type NativeButton = {
  readonly setParams: (params: Partial<NativeParams>) => void;
  readonly onClick: (listener: () => void) => () => void;
  readonly colored: boolean;
};
// An action that returns a promise keeps the button busy until it ends (docs/65 A4).
type BottomButtonProps = { readonly text: string; readonly onClick: () => unknown };

const noop = () => undefined;
const MAIN: NativeButton = {
  setParams: (params) => void mainButton.setParams.ifAvailable(params),
  onClick: (listener) => mainButton.onClick.ifAvailable(listener)?.[1] ?? noop,
  colored: true,
};
const SECONDARY: NativeButton = {
  setParams: (params) => void secondaryButton.setParams.ifAvailable(params),
  onClick: (listener) => secondaryButton.onClick.ifAvailable(listener)?.[1] ?? noop,
  colored: false,
};

// The main action is the native Telegram button at the bottom (docs/19, docs/21).
// Outside Telegram a TelegramUI button stands in for it, so the app also works in a browser.
function createBottomButton(native: NativeButton, mode: 'filled' | 'bezeled') {
  return function BottomButton({ text, onClick }: BottomButtonProps) {
    const inTelegram = useInTelegram();
    const { colors } = useBrand().theme;
    const { busy, run } = useOneAtATime(onClick);
    useEffect(() => {
      if (!inTelegram) return undefined;
      const color = native.colored ? { backgroundColor: colors.brandStrong, textColor: colors.bg } : {};
      native.setParams({ text, isVisible: true, ...color });
      const off = native.onClick(run);
      return () => {
        off();
        native.setParams({ isVisible: false });
      };
    }, [inTelegram, text, run, colors]);
    useEffect(() => {
      if (inTelegram) native.setParams({ isLoaderVisible: busy, isEnabled: !busy });
    }, [inTelegram, busy]);
    if (inTelegram) return null;
    return (
      <Button mode={mode} size="l" stretched loading={busy} disabled={busy} onClick={run}>
        {text}
      </Button>
    );
  };
}

export const MainButton = createBottomButton(MAIN, 'filled');
export const SecondaryButton = createBottomButton(SECONDARY, 'bezeled');
