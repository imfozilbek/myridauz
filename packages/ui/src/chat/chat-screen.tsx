import { MAX_CHAT_TEXT, type ChatMessage } from '@platform/contracts';
import { Button, Caption, Text, Title } from '@telegram-apps/telegram-ui';
import { IconButton, Textarea } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ErrorScreen } from '../states/error-screen';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { CallPanel } from '../call/call-panel';
import { useCall } from '../call/use-call';
import { Icon } from '../icons';
import { useChat } from './use-chat';
import { useChatLayout } from './use-chat-layout';
import { useChatText } from './use-chat-text';
import './chat.css';

type Props = { readonly chatKey: string; readonly title?: string; readonly onBack: () => void };

// The chat of a booking, like a Telegram chat (docs/07, docs/21): mine on the right, the other
// person on the left, lines about the booking in the middle. Text only.
export function ChatScreen({ chatKey, title, onBack }: Props) {
  useScreenView('chat');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { messages, state, warning, delivered, send, retry, calling } = useChat(chatKey);
  const controls = useCall(chatKey, calling);
  const name = title ?? t('chat.title');
  const { text, setText, submit } = useChatText(chatKey, send, delivered);
  const { chat, input, end } = useChatLayout(messages, state !== 'failed');
  if (state === 'failed') return <ErrorScreen onRetry={retry} title={t('chat.failed')} onBack={onBack} />;
  return (
    <div ref={chat} className="chat">
      <Screen onBack={controls.leave(onBack)} />
      <div className="chat-head">
        <Title weight="2">{name}</Title>
        {/* A voice call only after the confirmation; phone numbers are never shown (docs/08). */}
        {calling.canCall && !calling.call ? (
          <Button
            size="s"
            mode="bezeled"
            before={<Icon name="call" size={20} />}
            onClick={() => void controls.ring()}
          >
            {t('calls.call')}
          </Button>
        ) : null}
      </div>
      {calling.call || calling.ended ? (
        <CallPanel
          name={name}
          call={calling.call}
          ended={calling.ended}
          controls={controls}
          onChat={calling.dismiss}
        />
      ) : null}
      {controls.noMicrophone ? <Text className="chat-warning">{t('calls.noMicrophone')}</Text> : null}
      <div className="chat-messages">
        {messages.length === 0 ? <Caption className="chat-empty">{t('chat.empty')}</Caption> : null}
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
        <div ref={end} />
      </div>
      <form
        ref={input}
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {warning ? <Text className="chat-warning">{t('chat.warning')}</Text> : null}
        <Textarea
          aria-label={t('chat.placeholder')}
          rows={1}
          placeholder={t('chat.placeholder')}
          value={text}
          maxLength={MAX_CHAT_TEXT}
          onChange={(event) => setText(event.target.value)}
        />
        <IconButton
          type="submit"
          size="l"
          mode="bezeled"
          aria-label={t('chat.send')}
          disabled={state !== 'open' || text.trim().length === 0}
        >
          <Icon name="send" />
        </IconButton>
      </form>
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
