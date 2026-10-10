import '../account/account.css';
import type { ReactNode } from 'react';
import { useScreenBackground } from '../telegram/screen-background';
import { EmptyState, type EmptyStateProps } from './empty-state';

type Props = Omit<EmptyStateProps, 'action'> & {
  // The one action: the main button of Telegram, or the same button on the page outside Telegram.
  readonly button?: ReactNode;
};

// A whole screen of one state (G75, mockup g75/1 A): a block, an old launch, outside Telegram, a
// limit, a refused application. The state in the middle above the button.
export function StateScreen({ button, ...state }: Props) {
  useScreenBackground();
  return (
    <div className="center-screen">
      <EmptyState {...state} />
      <div className="state-foot">{button}</div>
    </div>
  );
}
