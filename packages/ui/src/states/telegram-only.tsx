import type { MiniApp } from '@platform/contracts';
import { useContext, type ReactNode } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { openApp } from '../telegram/open-app';
import { TelegramContext } from '../telegram/in-telegram-context';
import { MainButton } from '../telegram/bottom-button';
import { StateScreen } from './state-screen';

type Props = {
  readonly app: MiniApp;
  // A deployed app needs Telegram; a local run works in a browser too (docs/45).
  readonly required: boolean;
  readonly children: ReactNode;
};

// Outside Telegram, or inside it without a signed launch (a link preview), every call would fail with
// auth.missing: the person is asked to open it in Telegram instead (G52, docs/112). The bot opens it.
export function TelegramOnly({ app, required, children }: Props) {
  const { inTelegram, initData } = useContext(TelegramContext);
  const { t } = useI18n();
  const { bots } = useBrand();
  if ((inTelegram && initData !== '') || !required) return children;
  const open = () => openApp(bots[app]);
  return (
    <StateScreen
      icon="send"
      title={t('errors.telegram.title')}
      description={t('errors.telegram.description')}
      button={<MainButton text={t('errors.telegram.open')} onClick={open} />}
    />
  );
}
