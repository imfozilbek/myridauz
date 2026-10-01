import { Cell as TguiCell, type CellProps } from '@telegram-apps/telegram-ui';
import { PRESSABLE } from './pressable';

// A TelegramUI cell that a screen reader announces as a button when it opens something (docs/19).
// A cell with its own element (a label with a switch) keeps the role of that element.
// Every cell wraps its text: on a 360 px phone a cut subtitle hides its meaning (G27, lesson №66).
export function Cell(props: CellProps) {
  const cell = { multiline: true, ...props };
  if (!props.onClick || props.Component) return <TguiCell {...cell} />;
  return <TguiCell {...PRESSABLE} {...cell} />;
}
