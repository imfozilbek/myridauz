import { Cell, List, Modal, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import type { useNavigator } from './use-navigator';

type Navigators = ReturnType<typeof useNavigator>;

// Outside Telegram the navigator is chosen in a sheet over the map: the stops stay in their place
// (docs/88 L13). In Telegram the native window asks instead.
export function NavigatorSheet({ navigator }: { readonly navigator: Navigators }) {
  const { t } = useI18n();
  return (
    <Modal
      open={navigator.asking !== null}
      onOpenChange={(open) => {
        if (!open) navigator.cancel();
      }}
      header={<Modal.Header>{t('way.map.navigator')}</Modal.Header>}
    >
      <Choices navigator={navigator} />
    </Modal>
  );
}

function Choices({ navigator }: { readonly navigator: Navigators }) {
  useScreenView('bookings.navigator');
  const { t } = useI18n();
  return (
    <List>
      <Section>
        {navigator.navigators.map((id) => (
          <Cell
            key={id}
            onClick={() => {
              haptic.select();
              navigator.pick(id, navigator.asking);
            }}
          >
            {t(`way.navigator.${id}`)}
          </Cell>
        ))}
      </Section>
    </List>
  );
}
