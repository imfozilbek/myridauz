import { Section as TguiSection, type SectionProps } from '@telegram-apps/telegram-ui';
import { Children } from 'react';

// TelegramUI counts a null child as a row and draws a line under the last real one:
// only the rows that are there go in.
export function Section({ children, ...rest }: SectionProps) {
  return <TguiSection {...rest}>{Children.toArray(children)}</TguiSection>;
}
