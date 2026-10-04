import type { MiniApp } from '@platform/contracts';
import type { ReactNode } from 'react';
import { Button } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { openInTelegram } from '../telegram/feedback';
import { useInTelegram } from '../telegram/in-telegram-context';
import { EmptyState } from './empty-state';

type Props = {
  readonly app: MiniApp;
  // A deployed app needs Telegram; a local run works in a browser too (docs/45).
  readonly required: boolean;
  readonly children: ReactNode;
};

// Outside Telegram the app has no signed launch, so every call would fail with auth.missing: the
// person is asked to open it in Telegram instead (G52, docs/112). The bot of the app opens it.
export function TelegramOnly({ app, required, children }: Props) {
  const inTelegram = useInTelegram();
  const { t } = useI18n();
  const { bots } = useBrand();
  if (inTelegram || !required) return children;
  const open = (
    <Button size="m" onClick={() => openInTelegram(`https://t.me/${bots[app]}?startapp`)}>
      {t('errors.telegram.open')}
    </Button>
  );
  return (
    <EmptyState
      icon="send"
      title={t('errors.telegram.title')}
      description={t('errors.telegram.description')}
      action={open}
    />
  );
}
