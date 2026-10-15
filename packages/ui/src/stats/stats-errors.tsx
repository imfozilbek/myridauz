import type { ErrorRow } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { codeKey } from '../market/error-text';

// The Mini App of the waitlist goes by the name of its group in «Boshqaruv» (G83, G52).
const APP_NAMES: Readonly<Record<string, TranslationKey>> = {
  passenger: 'stats.app.passenger',
  driver: 'stats.app.driver',
  admin: 'stats.app.admin',
  main: 'waitlistTeam.group',
};
// A refusal without a text of its own: the words of the screen people saw then (G52, docs/112).
const SCREEN_WORDS: Readonly<Record<string, TranslationKey>> = { 'shares.not_found': 'share.follow.closed' };

// «Xatolar» in two parts (G52, docs/112): what broke a screen or the server comes first with its
// words; a refusal of a rule (a limit, a changed status) is below, in the words people read.
export function ErrorsSections({ errors }: { readonly errors: readonly ErrorRow[] }) {
  const { t, formatNumber } = useI18n();
  const crashes = errors.filter((row) => row.kind !== 'refusal');
  const refusals = errors.filter((row) => row.kind === 'refusal');
  const row = (item: ErrorRow, title: string) => {
    const app = APP_NAMES[item.app];
    return (
      <ManageRow
        key={`${item.kind}:${item.app}:${item.screen}:${item.code}:${item.what}`}
        icon="error"
        title={title}
        hint={`${app ? t(app) : item.app} · ${item.screen}`}
        value={formatNumber(item.count)}
      />
    );
  };
  const refusalTitle = (item: ErrorRow) => {
    const key = codeKey(item.code) ?? SCREEN_WORDS[item.code];
    return key ? t(key) : item.code;
  };
  return (
    <>
      <ManageGroup title={t('stats.crashes')}>
        {crashes.length === 0 ? <ManageRow icon="error" title={t('stats.errorsEmpty')} /> : null}
        {crashes.map((item) => row(item, item.what || item.code))}
      </ManageGroup>
      {refusals.length > 0 ? (
        <ManageGroup title={t('stats.refusals')}>
          {refusals.map((item) => row(item, refusalTitle(item)))}
        </ManageGroup>
      ) : null}
    </>
  );
}
