import { NavigatorSheet } from '../../bookings/navigator-sheet';
import { useNavigator } from '../../bookings/use-navigator';
import { useI18n } from '../../context/i18n-context';
import { ProfileRow } from './profile-row';

// The navigator of the driver in «Sozlamalar» (G75, docs/124 Ё): the one the map of a trip opens,
// chosen or changed here too. The native Telegram window asks; outside Telegram, a sheet.
export function NavigatorRow() {
  const { t } = useI18n();
  const navigator = useNavigator();
  return (
    <>
      <ProfileRow
        icon="trip"
        title={t('account.profile.navigator')}
        hint={navigator.navigator ? t(`way.navigator.${navigator.navigator}`) : t('places.choose')}
        onClick={navigator.change}
      />
      <NavigatorSheet navigator={navigator} />
    </>
  );
}
