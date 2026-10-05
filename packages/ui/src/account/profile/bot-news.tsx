import { useState } from 'react';
import { Cell, Section, Switch } from '../../components';
import { useI18n } from '../../context/i18n-context';
import { ActionFailure } from '../../states/action-failure';
import { useFailure } from '../../states/use-failure';
import { requestBotMessages } from '../../telegram/permissions';
import { useAccount } from '../account-context';

// «Bot xabarlari» like iOS: off stops the news and reminders; booking messages always come (docs/88 L1).
export function BotNews() {
  const account = useAccount();
  const { t } = useI18n();
  const [on, setOn] = useState(account?.profile.news ?? true);
  const { failure, fail, clear } = useFailure();
  if (!account) return null;
  const { client, profile, onProfileChanged } = account;
  const change = async (value: boolean) => {
    setOn(value);
    clear();
    try {
      await client.setNews(value);
      // A person from a channel link never let the bot write: Telegram asks now (docs/15).
      if (value && !profile.writeAccess && (await requestBotMessages())) await client.setWriteAccess(true);
      onProfileChanged();
    } catch (caught) {
      // The switch goes back and the screen says why (G43, docs/65 B3).
      setOn(!value);
      fail(caught);
    }
  };
  return (
    <>
      <ActionFailure error={failure} />
      <Section footer={t(on ? 'account.profile.newsHint' : 'account.profile.newsOffHint')}>
        <Cell
          Component="label"
          after={<Switch checked={on} onChange={(event) => void change(event.target.checked)} />}
        >
          {t('account.profile.news')}
        </Cell>
      </Section>
    </>
  );
}
