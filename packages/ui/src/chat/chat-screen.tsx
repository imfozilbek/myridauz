import type { ChatMessage } from '@platform/contracts';
import { Caption, Text } from '@telegram-apps/telegram-ui';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ErrorScreen } from '../states/error-screen';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { CallPanel } from '../call/call-panel';
import { otherName } from '../call/call-person';
import { useApiClients } from '../context/api-clients';
import { PlacesGate } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { useCall } from '../call/use-call';
import { ChatHead } from './chat-head';
import { ChatClosed, ChatInput } from './chat-input';
import { useChat } from './use-chat';
import { useRingOnce } from './use-ring-once';
import { useChatLayout } from './use-chat-layout';
import { useChatText } from './use-chat-text';
import './chat.css';

type Props = {
  readonly chatKey: string;
  readonly title?: string;
  // «Qoʻngʻiroq» of the booking page: the call starts as soon as the chat allows it (G60).
  readonly ring?: boolean | undefined;
  // The line of the trip opens its booking (mockup g60/2); a chat opened by a ring has none.
  readonly onTrip?: (() => void) | undefined;
  readonly onBack: () => void;
};

// The chat of a booking, like a Telegram chat (docs/07, docs/21): mine on the right, the other
// person on the left, lines about the booking in the middle. Text only.
export function ChatScreen(props: Props) {
  // The head names the places of the trip: the directory comes first (docs/48).
  return (
    <PlacesGate onBack={props.onBack}>
      <ChatRoom {...props} />
    </PlacesGate>
  );
}

function ChatRoom({ chatKey, title, ring = false, onTrip, onBack }: Props) {
  useScreenView('chat');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { messages, loaded, state, warning, canWrite, delivered, send, retry, calling } = useChat(chatKey);
  const controls = useCall(chatKey, calling);
  useRingOnce(ring && calling.canCall && !calling.call, controls.ring);
  // Who is on the other side and which trip: the chat opened by a ring has no title (G54).
  const { chat: chats } = useApiClients();
  const about = useLoad(() => chats.about(chatKey)).value ?? null;
  const name = title ?? (about && otherName(about)) ?? t('chat.title');
  const { text, setText, submit } = useChatText(chatKey, send, delivered);
  const { chat, input, end } = useChatLayout(messages, state !== 'failed');
  if (state === 'failed') return <ErrorScreen onRetry={retry} title={t('chat.failed')} onBack={onBack} />;
  return (
    <div ref={chat} className="chat">
      <Screen onBack={controls.leave(onBack)} />
      <ChatHead
        about={about}
        name={name}
        onCall={calling.canCall && !calling.call ? () => void controls.ring() : null}
        onTrip={onTrip}
      />
      {calling.call || calling.ended ? (
        <CallPanel
          name={name}
          about={about}
          call={calling.call}
          ended={calling.ended}
          controls={controls}
          onChat={calling.dismiss}
        />
      ) : null}
      {controls.noMicrophone ? <Text className="chat-warning">{t('calls.noMicrophone')}</Text> : null}
      <div className="chat-messages">
        {/* «No messages yet» only once the history came: never a flash of it while connecting (G41). */}
        {messages.length === 0 && loaded ? <Caption className="chat-empty">{t('chat.empty')}</Caption> : null}
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
        <div ref={end} />
      </div>
      {canWrite ? null : <ChatClosed />}
      <ChatInput
        hidden={!canWrite}
        form={input}
        text={text}
        onText={setText}
        onSubmit={submit}
        onReply={(reply) => void send(reply)}
        open={state === 'open'}
        warned={warning}
      />
    </div>
  );
}

function Bubble({ message }: { readonly message: ChatMessage }) {
  const { t, formatTime } = useI18n();
  if (message.author === 'system') {
    return (
      <Caption className="chat-system">{message.event ? t(`chat.system.${message.event}`) : ''}</Caption>
    );
  }
  return (
    <div className={`chat-bubble chat-${message.author}`}>
      <Text>{message.text}</Text>
      <Caption className="chat-time">{formatTime(new Date(message.at))}</Caption>
    </div>
  );
}
