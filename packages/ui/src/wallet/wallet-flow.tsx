import type { AppLink } from '@platform/contracts';
import { useState } from 'react';
import type { StartAction } from '../flow/start-action';
import { MyTripsScreen } from '../market/my-trips-screen';
import { WalletScreen } from './wallet-screen';

// The section the tile «Hamyon» of the main screen opens (docs/118 path 9).
export const WALLET_SECTION = 'wallet';

// «Hamyon» of a driver; «Safarni ochish» of a commission opens the trip or the booking in «Mening
// safarlarim» (G65, mockup g65/2), «Назад» comes back to «Hamyon».
function WalletFlow({ onBack }: { readonly onBack: () => void }) {
  const [link, setLink] = useState<AppLink | null>(null);
  if (link) return <MyTripsScreen link={link} onBack={() => setLink(null)} />;
  return <WalletScreen onBack={onBack} onOpen={setLink} />;
}

// Opened only by the tile «Hamyon» of an approved driver, not drawn as an action (docs/118 path 9).
export const WALLET_ACTION: StartAction = {
  id: WALLET_SECTION,
  icon: 'wallet',
  tone: 'accent',
  labelKey: 'wallet.title',
  hintKey: 'wallet.hint',
  Screen: WalletFlow,
};
