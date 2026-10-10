import { useApiClients } from '../context/api-clients';
import { useDriverData } from '../home/driver-data';
import { useLoad } from '../market/use-list';
import { usePassengerData } from '../home/passenger-data';
import { useNow } from '../own-trip/use-now';
import { chatRows } from './chat-rows';
import { ChatsScreen } from './chats-screen';
import { useUnreadChats } from './unread-chats';

type Props = { readonly onBack: () => void };

// «Suhbatlar» of a passenger: the chats of the seats and of the offers of drivers (G76).
export function PassengerChatsScreen({ onBack }: Props) {
  const { value } = usePassengerData();
  const unread = useUnreadChats();
  const now = useNow();
  const rows = value ? chatRows({ bookings: value[0], offers: value[2], unread, driver: false, now }) : null;
  return <ChatsScreen onBack={onBack} driver={false} rows={rows} now={now} />;
}

// «Suhbatlar» of a driver: the chats of the passengers of the trips and the talks about the requests
// the driver offered a trip on, read or not (mockup g76/5).
export function DriverChatsScreen({ onBack }: Props) {
  const { value } = useDriverData();
  const { bookings } = useApiClients();
  const offers = useLoad(() => bookings.driverOffers(), 'chats.offers').value;
  const unread = useUnreadChats();
  const now = useNow();
  const rows = value && offers ? chatRows({ bookings: value[1], offers, unread, driver: true, now }) : null;
  return <ChatsScreen onBack={onBack} driver rows={rows} now={now} />;
}
