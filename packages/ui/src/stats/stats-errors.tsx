import type { ErrorRow } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { codeKey } from '../market/error-text';

const APPS = ['passenger', 'driver', 'admin'] as const;
const appName = (app: string) =>
  (APPS as readonly string[]).includes(app) ? (app as (typeof APPS)[number]) : null;

// «Xatolar» in two parts (G52, docs/112): what broke a screen or the server comes first with its
// words; a refusal of a rule (a limit, a changed status) is below, in the words people read.
export function ErrorsSections({ errors }: { readonly errors: readonly ErrorRow[] }) {
  const { t, formatNumber } = useI18n();
  const crashes = errors.filter((row) => row.kind !== 'refusal');
  const refusals = errors.filter((row) => row.kind === 'refusal');
  const row = (item: ErrorRow, title: string) => {
    const app = appName(item.app);
    return (
      <ManageRow
        key={`${item.kind}:${item.app}:${item.screen}:${item.code}:${item.what}`}
        icon="error"
        title={title}
        hint={`${app ? t(`stats.app.${app}`) : item.app} · ${item.screen}`}
        value={formatNumber(item.count)}
      />
    );
  };
  const refusalTitle = (item: ErrorRow) => {
    const key = codeKey(item.code);
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
