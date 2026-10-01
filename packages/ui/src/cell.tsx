import { Cell as TguiCell, type CellProps } from '@telegram-apps/telegram-ui';
import { PRESSABLE } from './pressable';

// A TelegramUI cell that a screen reader announces as a button when it opens something (docs/19).
// A cell with its own element (a label with a switch) keeps the role of that element.
export function Cell(props: CellProps) {
  if (!props.onClick || props.Component) return <TguiCell {...props} />;
  return <TguiCell {...PRESSABLE} {...props} />;
}
