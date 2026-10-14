import type { WaitlistEntry } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { MainButton, SecondaryButton } from '../telegram/bottom-button';
import { CADENCE_ICONS, PAIN_ICONS, painKey, WaitlistCell } from './parts';

type Props = {
  readonly entry: WaitlistEntry;
  readonly route: string;
  readonly channels: number;
  readonly onEdit: () => void;
  readonly onChannels: () => void;
  readonly onInvite: () => Promise<void>;
  readonly onDriver: () => void;
};
const TICK = 28;

// «Siz roʻyxatdasiz» (mockup 3-result): the answers, who waits (from 10 people), how the brand answers
// each chosen pain, the channels; the passenger invites a friend, the driver goes to the driver bot.
export function ResultScreen({ entry, route, channels, onEdit, onChannels, onInvite, onDriver }: Props) {
  useScreenView('waitlist_done');
  const { t } = useI18n();
  const brand = useBrand();
  const { role, waiting } = entry;
  const first = entry.pains[0];
  const count = String(waiting?.passengers ?? 0);
  return (
    <>
      <div className="wl-ok">
        <span className="wl-ok-tile">
          <Icon name="selected" size={TICK} />
        </span>
        <div>
          <h1 className="wl-ok-title">{t('waitlist.done.title')}</h1>
          <p className="wl-ok-hint">{t('waitlist.done.hint')}</p>
        </div>
      </div>
      <div className="wl-card">
        <WaitlistCell icon="trip" title={route} hint={t('waitlist.route')} />
        <WaitlistCell
          icon={CADENCE_ICONS[entry.cadence]}
          title={t(`waitlist.cadence.${entry.cadence}`)}
          right={
            <button type="button" className="wl-link" onClick={onEdit}>
              {t('waitlist.done.change')}
            </button>
          }
        />
      </div>
      {waiting ? (
        <div className="wl-card">
          <WaitlistCell
            icon="passengers"
            title={t(role === 'driver' ? 'waitlist.done.waitingDriver' : 'waitlist.done.waiting', { count })}
            hint={
              role === 'driver' || !first
                ? t('waitlist.done.waitingDriverHint')
                : t('waitlist.done.waitingHint', {
                    share: String(waiting.share),
                    pain: t(painKey('pain', role, first)),
                  })
            }
          />
        </div>
      ) : null}
      <h2 className="wl-head">{t('waitlist.done.solves', { brand: brand.name })}</h2>
      <div className="wl-card">
        {entry.pains.map((pain) => (
          <WaitlistCell
            key={pain}
            icon={PAIN_ICONS[pain]}
            title={t(painKey('pain', role, pain))}
            hint={t(painKey('solution', role, pain), { brand: brand.name })}
          />
        ))}
      </div>
      <div className="wl-card">
        <WaitlistCell
          icon="channel"
          title={t('waitlist.done.channels')}
          hint={
            channels > 0
              ? t('waitlist.done.inChannels', { count: String(channels) })
              : t('waitlist.done.noChannels')
          }
          onClick={onChannels}
        />
      </div>
      {role === 'driver' ? (
        <>
          <MainButton text={t('waitlist.done.becomeDriver')} onClick={onDriver} />
          <SecondaryButton text={t('waitlist.done.invite')} onClick={onInvite} under />
        </>
      ) : (
        <MainButton text={t('waitlist.done.invite')} onClick={onInvite} />
      )}
    </>
  );
}
