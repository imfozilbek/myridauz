import type { HexColor } from '@platform/brands';
import { mainButton, secondaryButton } from '@telegram-apps/sdk-react';
import { useEffect } from 'react';
import { Button } from '../components';
import { useBrand } from '../context/brand-context';
import { useCoveredBySheet } from '../sheet/form-sheet-cover';
import { onSplashLeft, splashStands } from './chrome';
import { useInTelegram } from './in-telegram-context';
import { useOneAtATime } from './one-at-a-time';

type NativeParams = {
  text: string;
  isVisible: boolean;
  isLoaderVisible: boolean;
  isEnabled: boolean;
  backgroundColor?: HexColor;
  textColor?: HexColor;
  // The secondary button: on the left of the main one in the block at the bottom (G76), else above.
  position?: 'left' | 'top';
};
type NativeButton = {
  readonly setParams: (params: Partial<NativeParams>) => void;
  readonly onClick: (listener: () => void) => () => void;
  readonly colored: boolean;
};
// An action that returns a promise keeps the button busy until it ends (docs/65 A4).
// A dangerous action (delete, remove) is red, like in Telegram itself (docs/86 V12).
type BottomButtonProps = {
  readonly text: string;
  readonly onClick: () => unknown;
  readonly destructive?: boolean;
  // Gray and inert until the step is ready, like the consent of the registration (G58).
  readonly disabled?: boolean;
  // The pair of the block at the bottom of the main screen (G76): the secondary on the left in the
  // light color of the app, the main one on the right, as on the mockups g76.
  readonly beside?: boolean;
};

const noop = () => undefined;
// The splash has no button (docs/121 §4): a button asked for under it shows when it leaves.
function underSplash(set: (params: Partial<NativeParams>) => void) {
  let wanted = false;
  onSplashLeft(() => wanted && set({ isVisible: true }));
  return (params: Partial<NativeParams>) => {
    if (params.isVisible !== undefined) wanted = params.isVisible;
    set(wanted && splashStands() ? { ...params, isVisible: false } : params);
  };
}
const MAIN: NativeButton = {
  setParams: underSplash((params) => void mainButton.setParams.ifAvailable(params)),
  onClick: (listener) => mainButton.onClick.ifAvailable(listener)?.[1] ?? noop,
  colored: true,
};
const SECONDARY: NativeButton = {
  setParams: underSplash((params) => void secondaryButton.setParams.ifAvailable(params)),
  onClick: (listener) => secondaryButton.onClick.ifAvailable(listener)?.[1] ?? noop,
  colored: false,
};

// A step gives the button to the next one in the same moment: the button hides only when nobody
// claims it after the step left, so it never blinks between steps (G41, docs/108 E). A camera or a
// sheet over the step still hides it at once: nobody claims it there.
const hiding = new Map<NativeButton, ReturnType<typeof setTimeout>>();
function keepShown(native: NativeButton) {
  clearTimeout(hiding.get(native));
  hiding.delete(native);
}
function hideLater(native: NativeButton) {
  keepShown(native);
  const timer = setTimeout(() => {
    hiding.delete(native);
    native.setParams({ isVisible: false });
  });
  hiding.set(native, timer);
}

// The main action is the native Telegram button at the bottom (docs/19, docs/21).
// Outside Telegram a TelegramUI button stands in for it, so the app also works in a browser.
function createBottomButton(native: NativeButton, mode: 'filled' | 'bezeled') {
  return function BottomButton({
    text,
    onClick,
    destructive = false,
    disabled = false,
    beside = false,
  }: BottomButtonProps) {
    const inTelegram = useInTelegram();
    const { colors } = useBrand().theme;
    const { busy, run } = useOneAtATime(onClick);
    // Shown once and hidden on leave: a new render only changes the text, the button never blinks.
    useEffect(() => {
      if (!inTelegram) return undefined;
      const off = native.onClick(run);
      return () => {
        off();
        hideLater(native);
      };
    }, [inTelegram, run]);
    useEffect(() => {
      if (!inTelegram) return;
      const background = destructive ? colors.danger : colors.brandStrong;
      const look = disabled
        ? { backgroundColor: colors.disabled, textColor: colors.disabledText }
        : { backgroundColor: background, textColor: colors.bg };
      const soft = { backgroundColor: colors.brandSoft, textColor: colors.brandText };
      const color =
        native.colored || (beside && disabled)
          ? { ...look, ...(beside ? { position: 'left' as const } : {}) }
          : beside
            ? { ...soft, position: 'left' as const }
            : { position: 'top' as const };
      keepShown(native);
      native.setParams({ text, isVisible: true, ...color });
    }, [inTelegram, text, colors, destructive, disabled, beside]);
    useEffect(() => {
      if (inTelegram) native.setParams({ isLoaderVisible: busy, isEnabled: !busy && !disabled });
    }, [inTelegram, busy, disabled]);
    if (inTelegram) return null;
    return (
      <Button
        mode={mode}
        size="l"
        stretched
        loading={busy}
        disabled={busy || disabled}
        onClick={run}
        className={destructive ? 'danger-button' : undefined}
      >
        {text}
      </Button>
    );
  };
}

// A form sheet over the screen takes the button for its own step (G75, mockup g75/3 A).
function besideSheets(Button: ReturnType<typeof createBottomButton>) {
  return function SheetAwareButton(props: BottomButtonProps) {
    return useCoveredBySheet() ? null : <Button {...props} />;
  };
}

export const MainButton = besideSheets(createBottomButton(MAIN, 'filled'));
export const SecondaryButton = besideSheets(createBottomButton(SECONDARY, 'bezeled'));
