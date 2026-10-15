import type { GROWTH_BADGES } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';

type Badge = (typeof GROWTH_BADGES)[number];
// Reached with a tick; the next one with how many are left and its bar; the later ones pale.
export type BadgeState = 'reached' | 'next' | 'later';
const ICON = 22;
const TICK = 18;

export const badgeState = (badge: Badge, joined: number, next: Badge | undefined): BadgeState =>
  joined >= badge.people ? 'reached' : badge === next ? 'next' : 'later';

// One badge of «Sizning taʼsiringiz» (docs/123, mockup g69/2 phone 3).
export function ImpactBadge({
  badge,
  joined,
  state,
}: {
  readonly badge: Badge;
  readonly joined: number;
  readonly state: BadgeState;
}) {
  const { t, formatNumber } = useI18n();
  const brand = useBrand();
  const count = formatNumber(badge.people);
  const line = {
    reached: t('growth.impact.reached', { count }),
    next: t('growth.impact.next', { count, left: formatNumber(badge.people - joined) }),
    later: t('growth.impact.need', { count }),
  }[state];
  return (
    <div className={`impact-badge impact-badge-${state}`}>
      <span className="impact-badge-icon">
        <Icon name={badge.id} size={ICON} />
      </span>
      <span className="impact-badge-text">
        <b>{t(`growth.impact.badge.${badge.id}`, { brand: brand.name })}</b>
        <span>{line}</span>
        {state === 'next' ? (
          <span className="impact-bar" role="progressbar" aria-valuenow={joined} aria-valuemax={badge.people}>
            <span style={{ width: `${(joined / badge.people) * 100}%` }} />
          </span>
        ) : null}
      </span>
      {state === 'reached' ? <Icon name="selected" size={TICK} /> : null}
    </div>
  );
}
