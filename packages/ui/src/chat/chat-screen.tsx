import { MAX_CHAT_TEXT, type ChatMessage } from '@platform/contracts';
import { Button, Caption, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useRef, useState } from 'react';
import { Input } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ErrorScreen } from '../states/error-screen';
import { BackButton } from '../telegram/back-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { useChat } from './use-chat';
import './chat.css';

type Props = { readonly chatKey: string; readonly title?: string; readonly onBack: () => void };

// The chat of a booking, like a Telegram chat (docs/07, docs/21): mine on the right, the other
// person on the left, lines about the booking in the middle. Text only.
export function ChatScreen({ chatKey, title, onBack }: Props) {
  useScreenView('chat');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { messages, state, warning, send, retry } = useChat(chatKey);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView?.({ block: 'end' }), [messages.length]);
  if (state === 'failed') return <ErrorScreen onRetry={retry} />;
  const submit = () => {
    const value = text.trim();
    if (value.length === 0) return;
    if (send(value)) {
      haptic.tap();
      setText('');
    }
  };
  return (
    <div className="chat">
      <BackButton onClick={onBack} />
      <Title weight="2" className="chat-title">
        {title ?? t('chat.title')}
      </Title>
      <div className="chat-messages">
        {messages.length === 0 ? <Caption className="chat-empty">{t('chat.empty')}</Caption> : null}
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
        <div ref={end} />
      </div>
      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {warning ? <Text className="chat-warning">{t('chat.warning')}</Text> : null}
        <Input
          aria-label={t('chat.placeholder')}
          placeholder={t('chat.placeholder')}
          value={text}
          maxLength={MAX_CHAT_TEXT}
          onChange={(event) => setText(event.target.value)}
        />
        <Button type="submit" size="m" disabled={state !== 'open' || text.trim().length === 0}>
          {t('chat.send')}
        </Button>
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
