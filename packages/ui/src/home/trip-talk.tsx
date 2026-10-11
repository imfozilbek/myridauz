import type { AppLink } from '@platform/contracts';
import { useEffect } from 'react';
import { ChatScreen } from '../chat/chat-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { usePassengerData } from './passenger-data';

export const TRIP_TALK = 'trip_talk';
export const TALK_CALL = 'call';

type Props = { readonly onBack: () => void; readonly link?: AppLink };

// The chat or the call with the driver right from the card of the seat on the main screen (G66,
// mockup g66/1 phone 3); the link names the seat and whether it rings at once. A seat gone meanwhile
// leads back to the main screen.
export function TripTalk({ onBack, link }: Props) {
  const { value } = usePassengerData();
  const booking = value?.[0].find((item) => item.id === link?.id);
  const gone = Boolean(value) && !booking;
  useEffect(() => {
    if (gone) onBack();
  }, [gone, onBack]);
  if (!booking) return <ScreenSkeleton onBack={onBack} />;
  return (
    <ChatScreen
      chatKey={booking.chatKey}
      title={booking.trip.driver.firstName}
      ring={link?.name === TALK_CALL}
      onTrip={onBack}
      onBack={onBack}
    />
  );
}
