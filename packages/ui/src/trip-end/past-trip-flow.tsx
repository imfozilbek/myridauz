import type { Booking, Trip } from '@platform/contracts';
import { useState } from 'react';
import { ChatScreen } from '../chat/chat-screen';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { ComplaintScreen } from '../feedback/complaint-screen';
import { useMeetMark } from '../meeting/use-meet-mark';
import { ActionFailure } from '../states/action-failure';
import { openInTelegram } from '../telegram/feedback';
import { WalletScreen } from '../wallet/wallet-screen';
import type { AfterRow } from './after-rows';
import { PastTripPage } from './past-trip-page';
import { pickRider } from './pick-rider';
import type { ReturnTrip } from './return-plan';
import { RiderPick } from './rider-pick';
import { TripEndFlow } from './trip-end-flow';
import { taken } from './trip-sums';

type About = 'talk' | 'complain';
type Opened =
  | { readonly screen: 'chat' | 'call' | 'complain'; readonly booking: Booking }
  | { readonly screen: 'pick'; readonly about: About }
  | { readonly screen: 'rate' | 'wallet' };

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly onBack: () => void;
  // The stars were sent: the list refreshes the marks of the bookings.
  readonly onChanged: () => void;
  readonly onPublish: (back: ReturnTrip) => void;
};

// The past trip with what opens from it (docs/129): the chat and the call of a passenger, the
// complaint (support after its deadline), the stars not given yet with «Qaytish» after them
// (docs/124 В) and «Hamyon».
export function PastTripFlow({ trip, bookings, onBack, onChanged, onPublish }: Props) {
  const { t } = useI18n();
  const { bots } = useBrand();
  const [opened, setOpened] = useState<Opened | null>(null);
  const back = () => setOpened(null);
  const riders = bookings.filter(taken);
  const meet = useMeetMark(() => onChanged());
  const question = t('driverAfter.past.pick');
  const about = (row: About, booking: Booking) =>
    setOpened({ screen: row === 'talk' ? 'chat' : 'complain', booking });
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
  if (opened?.screen === 'pick')
    return (
      <RiderPick
        riders={riders}
        question={question}
        onPick={(booking) => about(opened.about, booking)}
        onBack={back}
      />
    );
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
    if (picked === 'support') return openInTelegram(`https://t.me/${bots.support}`);
    const booking = await pickRider(riders, question);
    if (booking === 'list') return setOpened({ screen: 'pick', about: picked });
    return booking ? about(picked, booking) : undefined;
  };
  return (
    <PastTripPage
      trip={trip}
      bookings={bookings}
      onBack={onBack}
      onChat={(booking) => setOpened({ screen: 'chat', booking })}
      onCall={(booking) => setOpened({ screen: 'call', booking })}
      onMark={(booking) => void meet.mark(booking, 'no_show')}
      onRow={(picked) => void row(picked)}
      onPublish={onPublish}
    >
      <ActionFailure error={meet.failure} />
    </PastTripPage>
  );
}
