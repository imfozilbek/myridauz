import { SegmentedControl as Library } from '@telegram-apps/telegram-ui';
import type { ComponentProps } from 'react';

type ItemProps = ComponentProps<typeof Library.Item>;

// The tabs of TelegramUI (docs/19). The open tab says so to TalkBack and VoiceOver: the library item
// shows it only by a bold word (G90 WALK-2).
function Item({ selected = false, ...props }: ItemProps) {
  return <Library.Item selected={selected} aria-selected={selected} {...props} />;
}

export function SegmentedControl(props: ComponentProps<typeof Library>) {
  return <Library {...props} />;
}
SegmentedControl.Item = Item;
