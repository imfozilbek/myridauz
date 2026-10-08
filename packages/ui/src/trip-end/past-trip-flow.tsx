import type { Booking, Trip } from '@platform/contracts';
import { useState } from 'react';
import { ChatScreen } from '../chat/chat-screen';
import { useI18n } from '../context/i18n-context';
import { ComplaintScreen } from '../feedback/complaint-screen';
import type { TripDraft } from '../market/trip-draft';
import { WalletScreen } from '../wallet/wallet-screen';
import type { AfterRow } from './after-rows';
import { PastTripPage } from './past-trip-page';
import { pickRider } from './pick-rider';
import { TripEndFlow } from './trip-end-flow';

type Opened =
  | { readonly screen: 'chat' | 'call' | 'complain'; readonly booking: Booking }
  | { readonly screen: 'rate' | 'wallet' };

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly onBack: () => void;
  // The stars were sent: the list refreshes the marks of the bookings.
  readonly onChanged: () => void;
  readonly onPublish: (draft: Partial<TripDraft>) => void;
};

const taken = (booking: Booking) => booking.status === 'confirmed' || booking.status === 'completed';

// The past trip with what opens from it (docs/129): the chat and the call of a passenger, the
// complaint, the stars not given yet with «Qaytish» after them (docs/124 В) and «Hamyon».
export function PastTripFlow({ trip, bookings, onBack, onChanged, onPublish }: Props) {
  const { t } = useI18n();
  const [opened, setOpened] = useState<Opened | null>(null);
  const back = () => setOpened(null);
  if (opened?.screen === 'chat' || opened?.screen === 'call')
    return (
      <ChatScreen
        chatKey={opened.booking.chatKey}
        title={opened.booking.passenger.firstName}
        ring={opened.screen === 'call'}
        onBack={back}
      />
    );
  if (opened?.screen === 'complain') return <ComplaintScreen bookingId={opened.booking.id} onBack={back} />;
  if (opened?.screen === 'rate')
    return (
      <TripEndFlow
        trip={trip}
        bookings={bookings}
        onPublish={onPublish}
        onClose={() => (back(), onChanged())}
      />
    );
  if (opened?.screen === 'wallet') return <WalletScreen onBack={back} />;
  const row = async (picked: AfterRow) => {
    if (picked === 'rate' || picked === 'commission')
      return setOpened({ screen: picked === 'rate' ? 'rate' : 'wallet' });
    const booking = await pickRider(bookings.filter(taken), t('driverAfter.past.pick'));
    if (booking) setOpened({ screen: picked === 'talk' ? 'chat' : 'complain', booking });
  };
  return (
    <PastTripPage
      trip={trip}
      bookings={bookings}
      onBack={onBack}
      onChat={(booking) => setOpened({ screen: 'chat', booking })}
      onCall={(booking) => setOpened({ screen: 'call', booking })}
      onRow={(picked) => void row(picked)}
      onPublish={onPublish}
    />
  );
}
