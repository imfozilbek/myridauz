import { useLayoutEffect } from 'react';
import { BackButton } from '../telegram/back-button';
import { PullRefresh } from './pull-refresh';

type ScreenProps = {
  // «Назад» of Telegram; none only on the main screen, where Android «Назад» closes the app.
  readonly onBack?: () => void;
  // A pull down at the top of a list refreshes it (owner's decision 02.10.2026, docs/94 W1).
  readonly onRefresh?: () => unknown;
};

// Every screen of the Mini Apps says itself what it is (docs/94, lesson 66): it opens at the top,
// not at the place of the last screen (F1), and holds «Назад» of Telegram while it is shown.
// A list going back to its place does it after this (useListPlace).
export function Screen({ onBack, onRefresh }: ScreenProps) {
  useLayoutEffect(() => window.scrollTo(0, 0), []);
  return (
    <>
      {onBack ? <BackButton onClick={onBack} /> : null}
      {onRefresh ? <PullRefresh onRefresh={onRefresh} /> : null}
    </>
  );
}
