import type { Work } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';

type NumbersProps = { readonly work: Work };

// The own numbers of a moderator under «Navbat» (docs/120, mockup g67/1): done today, how many wait,
// the average minutes of a case, how many waited over the limit of the owner (G34).
export function WorkNumbers({ work }: NumbersProps) {
  const { t } = useI18n();
  const limit = useBrand().moderation.ownerMinutes;
  const numbers = [
    { value: work.done, label: t('team.work.done') },
    { value: work.waiting, label: t('team.work.waiting') },
    { value: work.averageMinutes, label: t('team.work.average') },
    { value: work.over, label: t('team.work.over', { limit }) },
  ];
  return (
    <div className="work-numbers">
      {numbers.map(({ value, label }) => (
        <div key={label} className="work-number">
          <b>{value}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
