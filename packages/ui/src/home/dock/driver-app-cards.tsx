import { NEW_TRIP_SECTION, type Booking, type Wallet } from '@platform/contracts';
import { useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { markApprovalSeen } from '../../driver/approval-seen';
import { useDriver } from '../../driver/driver-context';
import type { HomeGo } from '../../flow/start-action';
import { openSheet } from '../../action-sheet/action-queue';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { DockCard } from './dock-card';
import { PASSENGER_REQUESTS } from './driver-idle';
import type { TripActions } from './trip-actions';

type Kind = 'draft' | 'fix' | 'welcome' | 'low' | 'short';
type Props = {
  readonly kind: Kind;
  readonly wallet: Wallet | null;
  readonly missing: number;
  readonly requests: readonly Booking[];
  readonly act: TripActions;
  readonly go: HomeGo;
};

// The application and the money of a driver (G76, mockup g76/3 states 1, 3, 4, 8, 10).
export function DriverAppCard({ kind, wallet, missing, requests, act, go }: Props) {
  const { t, formatMoney, formatShortDate } = useI18n();
  const driver = useDriver();
  const editCar = driver?.editCar ?? (() => undefined);
  const seats = String(wallet?.seatsLeft ?? 0);
  const publish = () => go(NEW_TRIP_SECTION);
  const board = () => go(PASSENGER_REQUESTS);
  switch (kind) {
    case 'draft':
      return (
        <>
          <DockCard
            chip={t('drivers.become.title')}
            title={t('drivers.application.title')}
            text={t('home.dock.carFill')}
          />
          <MainButton text={t('home.dock.fill')} onClick={editCar} />
        </>
      );
    case 'fix': {
      const [reason] = driver?.application.reasons ?? [];
      return (
        <>
          <DockCard
            chip={t('home.dock.fixTitle')}
            chipTone="red"
            tone="now"
            title={reason ? t(`drivers.reason.${reason}`) : t('home.dock.fixTitle')}
            text={t('drivers.status.fixHint')}
          />
          <MainButton text={t('home.dock.fix')} onClick={editCar} />
        </>
      );
    }
    case 'welcome':
      return (
        <>
          <Welcome />
          <DockCard
            chip={t('drivers.approved.title')}
            chipTone="green"
            title={t('home.wallet.bonus', { amount: formatMoney(wallet?.bonus ?? 0) })}
            text={t('wallet.card.seats', { count: seats })}
          />
          <SecondaryButton beside text={t('home.dock.requestsSee')} onClick={board} />
          <MainButton text={t('home.publish')} onClick={publish} />
        </>
      );
    case 'low': {
      const ends = wallet?.bonusExpiresAt;
      return (
        <>
          <DockCard
            chip={t('wallet.title')}
            tone="soon"
            title={t('wallet.card.seats', { count: seats })}
            text={ends ? t('home.dock.lowHint', { date: formatShortDate(new Date(ends)) }) : ''}
          />
          <SecondaryButton beside text={t('home.publish')} onClick={publish} />
          <MainButton text={t('wallet.topUp')} onClick={act.topUp(requests[0], missing)} />
        </>
      );
    }
    case 'short':
      return (
        <>
          <DockCard
            chip={t('home.dock.short')}
            chipTone="red"
            tone="now"
            title={t('home.dock.shortWaiting', { count: String(requests.length) })}
            text={t('home.dock.shortHint', { amount: formatMoney(missing) })}
          />
          <SecondaryButton beside text={t('home.dock.requests')} onClick={() => openSheet('request')} />
          <MainButton text={t('wallet.topUp')} onClick={act.topUp(requests[0], missing)} />
        </>
      );
  }
}

// «Siz haydovchisiz!» is told once (G62): the first visit marks it seen.
function Welcome() {
  useEffect(markApprovalSeen, []);
  return null;
}
