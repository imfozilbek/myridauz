import type { Standing } from '@platform/contracts';
import { useOpenSupport } from '../../telegram/support-link';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { useDriver } from '../../driver/driver-context';
import { UzPlate } from '../../plate/uz-plate';
import { Switch } from '../../switch';
import { openApp } from '../../telegram/open-app';
import { useAccount } from '../account-context';
import { formatPhone } from '../cell-value';
import { ChannelsRow } from './channels-row';
import { HomeScreenRow } from './home-screen-row';
import { NavigatorRow } from './navigator-row';
import { ProfileGroup, ProfileRow } from './profile-row';

export type ProfileOpen = 'reviews' | 'channels' | 'subscriptions' | 'impact' | 'qr' | 'documents' | 'delete';
// What the head of the main screen opens straight away (G76): the ratings, how the drivers see one.
export type ProfilePart = 'reviews' | 'look' | 'photo';

type Props = {
  readonly standing: Standing | null;
  readonly onOpen: (screen: ProfileOpen) => void;
};

// The rows of «Profil» (G65, mockup g65/3): the car of a driver, the reviews, the history and the
// channels; «Sozlamalar» with «Bot xabarlari» always on and the phone only the person sees; «Yordam».
export function ProfileRows({ standing, onOpen }: Props) {
  const { t } = useI18n();
  const brand = useBrand();
  const { bots } = brand;
  const support = useOpenSupport();
  const account = useAccount();
  const driver = useDriver();
  const car = driver?.application.status === 'approved' ? driver.application.car : null;
  if (!account) return null;
  const bot = t('account.profile.bot');
  return (
    <>
      <ProfileGroup>
        {driver && car ? (
          <ProfileRow
            icon="carSide"
            title={t('drivers.car')}
            hint={t('account.profile.car', { model: car.model, color: t(`drivers.color.${car.color}`) })}
            after={<UzPlate plate={car.plate} size="s" />}
            onClick={driver.editCar}
          />
        ) : null}
        <ProfileRow
          icon="star"
          title={t('account.profile.reviews')}
          hint={t('account.profile.reviewsCount', { count: String(standing?.rating.count ?? 0) })}
          onClick={() => onOpen('reviews')}
        />
        <ChannelsRow onOpen={() => onOpen('channels')} />
        {/* What came of the person's links, and the QR of a driver on the glass (G69, docs/123). */}
        <ProfileRow
          icon="companion"
          title={t('growth.impact.title')}
          hint={t('growth.impact.lead', { brand: brand.name })}
          onClick={() => onOpen('impact')}
        />
        {driver && car ? (
          <ProfileRow
            icon="qr"
            title={t('growth.qr.title')}
            hint={t('growth.qr.hint')}
            onClick={() => onOpen('qr')}
          />
        ) : null}
        {/* «Obunalar» one tap from «Profil», under «Kanallar» (G78 П22). */}
        <ProfileRow
          icon="subscriptions"
          title={t('subscriptions.title')}
          onClick={() => onOpen('subscriptions')}
        />
        {/* «Haydovchi boʻling» is here always for a passenger, the strip of the main screen only while
            its block is free (G76, docs/165); never in the driver app itself (G90 DRV-13). */}
        {driver || account.profile.roles.includes('driver') ? null : (
          <ProfileRow
            icon="carSide"
            title={t('home.becomeDriver.title')}
            hint={t('home.becomeDriver.hint')}
            onClick={() => openApp(bots.driver)}
          />
        )}
      </ProfileGroup>
      <ProfileGroup header={t('account.profile.settings')}>
        {/* The bot always writes about bookings, chats and trips: shown, never switched off (G65). */}
        <ProfileRow
          icon="botMessages"
          title={bot}
          hint={t('account.profile.botHint')}
          after={<Switch className="profile-switch" aria-label={bot} checked disabled readOnly />}
        />
        <ProfileRow
          icon="mobile"
          title={t('account.profile.phone')}
          hint={t('account.profile.phoneLine', { phone: formatPhone(account.profile.phone) })}
        />
        {driver ? <NavigatorRow /> : null}
        <HomeScreenRow />
      </ProfileGroup>
      <ProfileGroup header={t('home.support')}>
        <ProfileRow icon="help" title={t('home.support')} onClick={() => support()} />
        <ProfileRow
          icon="file"
          title={t('account.profile.documents')}
          hint={t('account.profile.documentsHint')}
          onClick={() => onOpen('documents')}
        />
      </ProfileGroup>
      <button type="button" className="profile-delete" onClick={() => onOpen('delete')}>
        {t('account.delete.open')}
      </button>
    </>
  );
}
