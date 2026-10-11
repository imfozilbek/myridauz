import { WALLET_SECTION, type AppLink } from '@platform/contracts';
import { useState } from 'react';
import type { StartAction } from '../flow/start-action';
import { MyTripsScreen } from '../market/my-trips-screen';
import { KeptBehind } from '../telegram/kept-behind';
import { WalletScreen } from './wallet-screen';

// «Hamyon» of a driver; «Safarni ochish» of a commission opens the trip or the booking in «Mening
// safarlarim» (G65, mockup g65/2). «Hamyon» stays under it: «Назад» comes back to the very details (G77).
function WalletFlow({ onBack }: { readonly onBack: () => void }) {
  const [link, setLink] = useState<AppLink | null>(null);
  return (
    <>
      <KeptBehind under={link !== null}>
        <WalletScreen onBack={onBack} onOpen={setLink} />
      </KeptBehind>
      {link ? <MyTripsScreen link={link} onBack={() => setLink(null)} /> : null}
    </>
  );
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
