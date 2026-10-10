import type { Standing } from '@platform/contracts';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { useDriver } from '../../driver/driver-context';
import { UzPlate } from '../../plate/uz-plate';
import { Switch } from '../../switch';
import { openInTelegram } from '../../telegram/feedback';
import { useAccount } from '../account-context';
import { formatPhone } from '../cell-value';
import { ChannelsRow } from './channels-row';
import { NavigatorRow } from './navigator-row';
import { ProfileGroup, ProfileRow } from './profile-row';

export type ProfileOpen = 'history' | 'reviews' | 'channels' | 'documents' | 'delete';

type Props = {
  readonly standing: Standing | null;
  readonly onOpen: (screen: ProfileOpen) => void;
};

// The rows of «Profil» (G65, mockup g65/3): the car of a driver, the reviews, the history and the
// channels; «Sozlamalar» with «Bot xabarlari» always on and the phone only the person sees; «Yordam».
export function ProfileRows({ standing, onOpen }: Props) {
  const { t } = useI18n();
  const { bots } = useBrand();
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
        <ProfileRow icon="history" title={t('comfort.history.title')} onClick={() => onOpen('history')} />
        <ChannelsRow onOpen={() => onOpen('channels')} />
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
      </ProfileGroup>
      <ProfileGroup header={t('home.support')}>
        <ProfileRow
          icon="help"
          title={t('home.support')}
          onClick={() => openInTelegram(`https://t.me/${bots.support}`)}
        />
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
