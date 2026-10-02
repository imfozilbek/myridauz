import { Switch as TguiSwitch, type SwitchProps } from '@telegram-apps/telegram-ui';
import { haptic } from './telegram/feedback';

// The iOS-like switch of TelegramUI that ticks softly when it changes, like Telegram's own (docs/88 L3).
export function Switch({ onChange, ...props }: SwitchProps) {
  return (
    <TguiSwitch
      {...props}
      onChange={(event) => {
        haptic.select();
        onChange?.(event);
      }}
    />
  );
}
