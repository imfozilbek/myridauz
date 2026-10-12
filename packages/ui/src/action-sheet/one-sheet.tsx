import { Modal } from '../components';
import { useI18n } from '../context/i18n-context';
import { SheetOverlay } from '../home/sheet-overlay';
import { SheetBack } from '../sheet/sheet-back';
import { useSheetShown } from '../telegram/sheet-shown';
import { ActionCard } from './action-card';
import type { ActionItem } from './action-item';

type Props = {
  readonly item: ActionItem | null;
  // After an answer: the page decides what comes next (the seat, the list).
  readonly onDone: () => void;
  readonly onClose: () => void;
};

// One thing over a page is the sheet of the main screen (G78, docs/122): the same card and answers
// over «Mening soʻrovim» and «Mening safarim»; «Keyinroq» closes it over the page.
export function OneSheet({ item, onDone, onClose }: Props) {
  const { t } = useI18n();
  useSheetShown(item !== null);
  return (
    <Modal
      overlayComponent={<SheetOverlay />}
      open={item !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
    >
      {item ? <SheetBack onClose={onClose} /> : null}
      {item ? (
        <ActionCard
          key={item.key}
          item={item}
          counter={null}
          laterLabel={t('sheet.later')}
          onDone={onDone}
          onLater={onClose}
        />
      ) : null}
    </Modal>
  );
}
