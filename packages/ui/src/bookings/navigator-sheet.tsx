import type { Navigator } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { FormSheet } from '../sheet/form-sheet';
import { haptic } from '../telegram/feedback';
import './navigator-sheet.css';
import type { useNavigator } from './use-navigator';

type Navigators = ReturnType<typeof useNavigator>;

const ICONS: Record<Navigator, IconName> = { yandex: 'navigate', google: 'map', apple: 'compass' };
const TILE_ICON = 20;
const CHEVRON = 18;

// «Qaysi navigatorda ochamiz?» (G75, mockup g75/6 A): a sheet over the map, in Telegram too; the
// stops stay in their place (docs/88 L13) and the choice is kept for the next time.
export function NavigatorSheet({ navigator }: { readonly navigator: Navigators }) {
  const { t } = useI18n();
  return (
    <FormSheet open={navigator.asking !== null} title={t('way.map.navigator')} onClose={navigator.cancel}>
      {navigator.asking !== null ? <Choices navigator={navigator} /> : null}
    </FormSheet>
  );
}

function Choices({ navigator }: { readonly navigator: Navigators }) {
  useScreenView('bookings.navigator');
  const { t } = useI18n();
  return (
    <>
      <div className="navigator-rows">
        {navigator.navigators.map((id) => (
          <button
            key={id}
            type="button"
            className="navigator-row"
            onClick={() => {
              haptic.select();
              navigator.pick(id, navigator.asking);
            }}
          >
            <span className="navigator-tile">
              <Icon name={ICONS[id]} size={TILE_ICON} />
            </span>
            <span className="navigator-name">{t(`way.navigator.${id}`)}</span>
            <Icon name="next" size={CHEVRON} />
          </button>
        ))}
      </div>
      <p className="navigator-note">{t('way.map.navigatorKept')}</p>
    </>
  );
}
