import type { FavoriteDriver } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { FormSheet } from '../sheet/form-sheet';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';

type Props = {
  readonly driver: FavoriteDriver | null;
  readonly onClose: () => void;
  readonly onRemoved: () => void;
};

// A saved driver in a sheet over «Sevimli haydovchilar» (owner decision 20.10.2026, G90 PAS-4): who
// and which car; «Sevimlilardan olib tashlash» takes him out, his trips stop coming.
export function FavoriteSheet({ driver, onClose, onRemoved }: Props) {
  const { t } = useI18n();
  const { comfort } = useApiClients();
  const { failure, fail, clear } = useFailure();
  const remove = async (id: FavoriteDriver['id']) => {
    clear();
    try {
      await comfort.forget(id);
      haptic.success();
      onRemoved();
    } catch (caught) {
      fail(caught);
    }
  };
  const car = driver
    ? `${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`
    : undefined;
  return (
    <FormSheet
      open={driver !== null}
      title={driver?.firstName ?? ''}
      {...(car ? { hint: car } : {})}
      onClose={onClose}
    >
      {driver ? (
        <>
          <ActionFailure error={failure} />
          <MainButton
            text={t('comfort.favorites.remove')}
            destructive
            onClick={() => void remove(driver.id)}
          />
        </>
      ) : null}
    </FormSheet>
  );
}
