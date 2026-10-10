import { Title } from '@telegram-apps/telegram-ui';
import { useOpenChat } from '../chat/open-chat';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useHomeGo } from '../flow/home-context';
import { PlacesGate } from '../market/places-gate';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { ChatCard } from './chat-card';
import type { ChatRow } from './chat-rows';
import './chats.css';

type Props = {
  readonly onBack: () => void;
  readonly driver: boolean;
  // From the lists the main screen already holds (G76); null while they load.
  readonly rows: readonly ChatRow[] | null;
  readonly now: number;
};

// «Suhbatlar» of the tile (G76, mockup g76/5, list 2A of G75): every chat of the live seats and the
// week after, the unread on top with their words; a tap opens the chat. Empty: one way forward.
export function ChatsScreen(props: Props) {
  return (
    <PlacesGate onBack={props.onBack}>
      <Chats {...props} />
    </PlacesGate>
  );
}

function Chats({ onBack, driver, rows, now }: Props) {
  useScreenView('chats');
  useScreenBackground();
  const { t } = useI18n();
  const go = useHomeGo();
  const [places] = useDirectory();
  if (!rows || places.status !== 'ready') return <ScreenSkeleton onBack={onBack} />;
  if (rows.length === 0)
    return (
      <>
        <Screen onBack={onBack} />
        <Title weight="1" className="market-title">
          {t('home.chats.title')}
        </Title>
        <EmptyState
          icon="chat"
          title={t('chat.list.empty')}
          description={t(driver ? 'chat.list.emptyDriver' : 'chat.list.emptyPassenger')}
        />
        {go ? (
          <MainButton
            text={t(driver ? 'common.driver.passengerRequests' : 'common.passenger.findTrip')}
            onClick={() => go(driver ? 'passenger_requests' : 'find_trip')}
          />
        ) : null}
      </>
    );
  return <List rows={rows} directory={places.directory} now={now} onBack={onBack} />;
}

type ListProps = {
  readonly rows: readonly ChatRow[];
  readonly directory: PlaceDirectory;
  readonly now: number;
  readonly onBack: () => void;
};

function List({ rows, directory, now, onBack }: ListProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const openChat = useOpenChat();
  return (
    <div className="market chats" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('home.chats.title')}
      </Title>
      <p className="chats-hint">{t('chat.list.hint')}</p>
      {rows.map((row) => (
        <ChatCard key={row.key} row={row} directory={directory} now={now} onOpen={() => openChat(row.key)} />
      ))}
    </div>
  );
}
