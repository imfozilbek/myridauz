import type { Offer, OfferAction } from '@platform/contracts';
import { useOfferItem } from '../action-sheet/kinds/offer-item';
import { OneSheet } from '../action-sheet/one-sheet';
import { usePlaces } from '../market/places-gate';

type Props = {
  readonly offer: Offer | null;
  // The offers of the request still waiting: more than one, «Barcha takliflar (n)».
  readonly same: number;
  // Fails with its reason: the sheet stays and says why (docs/65 B3).
  readonly onAnswer: (offer: Offer, action: OfferAction) => Promise<unknown>;
  readonly onClose: () => void;
};

// One offer over «Mening soʻrovim» is the sheet of the main screen (G78 sheet 2, docs/122): the same
// card and answers. «Barcha takliflar» and «Keyinroq» close it over the list of the offers; the
// answer itself moves the page on (onAnswer).
export function RequestOfferSheet({ offer, same, onAnswer, onClose }: Props) {
  const item = useOfferItem(usePlaces());
  return (
    <OneSheet
      item={offer ? item(offer, same, onAnswer, onClose) : null}
      onDone={() => undefined}
      onClose={onClose}
    />
  );
}
