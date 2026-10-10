import { useI18n } from '../context/i18n-context';
import type { TranslationKey } from '@platform/i18n';

export type CaseAction = {
  readonly labelKey: TranslationKey;
  // A hard decision is red: «Rad etish», «Bloklash», «Mos emas: sababi» (mockup g67/2).
  readonly danger?: boolean;
  readonly onClick: () => void;
};

// The other decisions of a case in one row at the bottom; the main one is the button of Telegram.
export function CaseButtons({ actions }: { readonly actions: readonly CaseAction[] }) {
  const { t } = useI18n();
  return (
    <div className="case-buttons">
      {actions.map(({ labelKey, danger = false, onClick }) => (
        <button
          key={labelKey}
          type="button"
          className={danger ? 'case-button case-danger' : 'case-button'}
          onClick={onClick}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
