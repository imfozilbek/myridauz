import type { PersonId } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { openInTelegram } from '../telegram/feedback';

// Who the person is in Telegram, in the checks of the team (owner, 17.10.2026): the public name opens
// the profile in one tap; without one, Telegram opens no profile by its number in a Mini App.
export function TelegramLine({ id }: { readonly id: PersonId }) {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const account = useLoad(() => moderation.telegramAccount(id)).value;
  if (!account) return null;
  const { username } = account;
  return username ? (
    <button
      type="button"
      className="case-telegram"
      onClick={() => openInTelegram(`https://t.me/${username}`)}
    >
      {t('navbat.telegram.username', { username })}
    </button>
  ) : (
    <p className="case-telegram case-muted">{t('navbat.telegram.none')}</p>
  );
}
