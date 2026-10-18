import type { PersonId } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { openInTelegram } from '../telegram/feedback';

// Who the person is in Telegram, in the checks of the team (owner, 17.10.2026): the public name opens
// the profile in one tap. Without one, «Profilni ochish» goes to the bot the person knows: only there
// Telegram opens a profile by its number (owner, 18.10.2026).
export function TelegramLine({ id }: { readonly id: PersonId }) {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const account = useLoad(() => moderation.telegramAccount(id)).value;
  if (!account) return null;
  const { username, profileLink } = account;
  return username ? (
    <button
      type="button"
      className="case-telegram"
      onClick={() => openInTelegram(`https://t.me/${username}`)}
    >
      {t('navbat.telegram.username', { username })}
    </button>
  ) : (
    <p className="case-telegram case-telegram-none">
      <span className="case-muted">{t('navbat.telegram.none')}</span>
      <button type="button" className="case-telegram" onClick={() => openInTelegram(profileLink)}>
        {t('navbat.telegram.profile')}
      </button>
    </p>
  );
}
