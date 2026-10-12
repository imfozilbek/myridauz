import type { Offer, OfferAction } from '@platform/contracts';
import { ActionCard } from '../action-sheet/action-card';
import { useOfferItem } from '../action-sheet/kinds/offer-item';
import { Modal } from '../components';
import { useI18n } from '../context/i18n-context';
import { SheetOverlay } from '../home/sheet-overlay';
import { usePlaces } from '../market/places-gate';
import { SheetBack } from '../sheet/sheet-back';
import { useSheetShown } from '../telegram/sheet-shown';

type Props = {
  readonly offer: Offer | null;
  // The offers of the request still waiting: more than one, «Barcha takliflar (n)».
  readonly same: number;
  // Fails with its reason: the sheet stays and says why (docs/65 B3).
  readonly onAnswer: (offer: Offer, action: OfferAction) => Promise<unknown>;
  readonly onClose: () => void;
};

// One offer over «Mening soʻrovim» is the sheet of the main screen (G78 sheet 2, docs/122): the same
// card and answers. «Barcha takliflar» and «Keyinroq» close it over the list of the offers.
export function RequestOfferSheet({ offer, same, onAnswer, onClose }: Props) {
  const { t } = useI18n();
  const item = useOfferItem(usePlaces());
  useSheetShown(offer !== null);
  const shown = offer ? item(offer, same, onAnswer, onClose) : null;
  return (
    <Modal
      overlayComponent={<SheetOverlay />}
      open={shown !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
    >
      {shown ? <SheetBack onClose={onClose} /> : null}
      {shown ? (
        <ActionCard
          key={shown.key}
          item={shown}
          counter={null}
          laterLabel={t('sheet.later')}
          onDone={() => undefined}
          onLater={onClose}
        />
      ) : null}
    </Modal>
  );
}
