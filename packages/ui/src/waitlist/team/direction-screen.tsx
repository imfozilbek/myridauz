import type { Cadence, Pain, WaitlistDirection } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Fragment, useState } from 'react';
import { useApiClients } from '../../context/api-clients';
import { useTeamOwner } from '../../team/use-owner';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../../manage/manage-page';
import { useLoad } from '../../market/use-list';
import { FormSheet } from '../../sheet/form-sheet';
import { ScreenSkeleton } from '../../states/screen-skeleton';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { painKey } from '../parts';
import { useRouteName } from './waiting-block';
import './team.css';
import { ErrorScreen } from '../../states/error-screen';

type Counted = { readonly label: string; readonly count: number };

// «Har hafta 61 · Har oy 30»: the names gray, the numbers bold (mockup 4-admin).
function CountLine({ items }: { readonly items: readonly Counted[] }) {
  return (
    <p className="wl-team-line">
      {items.map(({ label, count }, index) => (
        <Fragment key={label}>
          {index > 0 ? ' · ' : null}
          {label} <b>{count}</b>
        </Fragment>
      ))}
    </p>
  );
}

type Props = { readonly region: string; readonly onBack: () => void };

// One direction of the list (docs/181, mockup 4-admin): who waits and how often, what hurts the
// passengers, the drivers; «Yoʻnalishni ochish»: the bot tells everyone who waits, once.
export function DirectionScreen({ region, onBack }: Props) {
  useScreenView('waitlist_direction');
  const { t, formatDate } = useI18n();
  const { waitlist } = useApiClients();
  const route = useRouteName();
  const { value, failed, error, reload } = useLoad(() => waitlist.direction(region));
  const [asking, setAsking] = useState(false);
  const owner = useTeamOwner();
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} error={error} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const cadences = (side: WaitlistDirection['passengers']) =>
    side.cadences.map(({ cadence, count }: { cadence: Cadence; count: number }) => ({
      label: t(`waitlist.cadence.${cadence}`),
      count,
    }));
  const { passengers, drivers, opened } = value;
  const open = async () => {
    await waitlist.openDirection(region);
    setAsking(false);
    reload();
  };
  return (
    <ManagePage
      title={route(region)}
      hint={value.since === null ? '' : t('waitlistTeam.since', { date: formatDate(new Date(value.since)) })}
      onBack={onBack}
    >
      <ManageGroup title={t('waitlistTeam.passengers', { n: passengers.count })}>
        <CountLine items={cadences(passengers)} />
      </ManageGroup>
      <ManageGroup title={t('waitlistTeam.passengerPains')}>
        {passengers.pains.map(({ pain, share }: { pain: Pain; share: number }) => (
          <div key={pain} className="wl-bar">
            <span className="wl-bar-top">
              <span>{t(painKey('pain', 'passenger', pain))}</span>
              <b>{share} %</b>
            </span>
            <span className="wl-meter">
              <i style={{ width: `${share}%` }} />
            </span>
          </div>
        ))}
      </ManageGroup>
      <ManageGroup title={t('waitlistTeam.drivers', { n: drivers.count })}>
        <CountLine items={cadences(drivers)} />
        <CountLine
          items={drivers.pains.map(({ pain, count }) => ({
            label: t(`waitlistTeam.short.${pain}` as TranslationKey),
            count,
          }))}
        />
        <ManageRow title={t('waitlistTeam.approved')} value={drivers.approved} />
      </ManageGroup>
      {opened ? (
        <p className="manage-hint">
          {t('waitlistTeam.opened', { date: formatDate(new Date(opened.at)) })} ·{' '}
          {t('waitlistTeam.sent', { n: opened.sent })}
        </p>
      ) : owner ? (
        // Opening a direction is the owner's (ownerOnly): a moderator reads it (G91 ADM-1).
        <MainButton text={t('waitlistTeam.open')} onClick={() => setAsking(true)} />
      ) : null}
      <FormSheet
        open={asking}
        grouped
        title={t('waitlistTeam.openAsk')}
        hint={t('waitlistTeam.openHint', { p: passengers.count, d: drivers.count })}
        onClose={() => setAsking(false)}
      >
        <MainButton text={t('waitlistTeam.openYes')} onClick={open} />
        <SecondaryButton text={t('waitlistTeam.cancel')} onClick={() => setAsking(false)} under />
      </FormSheet>
    </ManagePage>
  );
}
