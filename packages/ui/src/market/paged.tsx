import { Button } from '@telegram-apps/telegram-ui';
import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { keepValue, keptValue } from '../screen/list-memory';

const PAGE = 10;

type Props<T> = {
  readonly items: readonly T[];
  readonly render: (item: T) => ReactNode;
  // The pages shown come back after «Назад» (docs/94 F2).
  readonly memory?: string;
};

// A long list shows 10 at a time and "Yana koʻrsatish" for the next ones (docs/65 B6): the trips
// ahead stay on top, the old ones wait below.
export function Paged<T>({ items, render, memory }: Props<T>) {
  const { t } = useI18n();
  const key = memory && `${memory}:shown`;
  const [shown, setShown] = useState(() => (key ? (keptValue<number>(key) ?? PAGE) : PAGE));
  useEffect(() => {
    if (key) keepValue(key, shown);
  }, [key, shown]);
  return (
    <>
      {items.slice(0, shown).map(render)}
      {items.length > shown ? (
        <div className="step-note">
          <Button mode="plain" size="m" stretched onClick={() => setShown(shown + PAGE)}>
            {t('market.mine.more')}
          </Button>
        </div>
      ) : null}
    </>
  );
}
