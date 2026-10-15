import { ROLE_PAINS, type Pain, type WaitlistRole } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { MainButton } from '../telegram/bottom-button';
import { PAIN_ICONS, painKey, WaitlistSteps, WaitlistTile, WaitlistTitle } from './parts';

type Props = {
  readonly role: WaitlistRole;
  readonly chosen: readonly Pain[];
  readonly onToggle: (pain: Pain) => void;
  readonly onNext: () => void;
};
const TICK = 16;

// «Safar davomida qanday muammolarga duch kelgansiz?» (mockup 2, screens 2 and 9): the owner's words,
// one or several ticks; «Davom etish» stays gray until one is chosen.
export function PainsStep({ role, chosen, onToggle, onNext }: Props) {
  useScreenView('waitlist_pains');
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <>
      <WaitlistSteps at={1} />
      <div className="wl-pains-title">
        <WaitlistTitle title={t('waitlist.pains.title')} hint={t('waitlist.pains.hint')} />
      </div>
      <div className="wl-card wl-pains" role="group">
        {ROLE_PAINS[role].map((pain: Pain) => {
          const on = chosen.includes(pain);
          return (
            <button
              key={pain}
              type="button"
              role="checkbox"
              aria-checked={on}
              className={on ? 'wl-cell wl-picked' : 'wl-cell'}
              onClick={() => onToggle(pain)}
            >
              <WaitlistTile icon={PAIN_ICONS[pain]} />
              <span className="wl-cell-text">
                <b>{t(painKey('pain', role, pain))}</b>
                <span className="wl-cell-hint">{t(painKey('hint', role, pain))}</span>
              </span>
              <span className={on ? 'wl-box wl-box-on' : 'wl-box'}>
                {on ? <Icon name="selected" size={TICK} color={colors.bg} /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <MainButton text={t('common.continue')} disabled={chosen.length === 0} onClick={onNext} />
    </>
  );
}
