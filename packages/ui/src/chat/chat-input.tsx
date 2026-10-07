import { MAX_CHAT_TEXT } from '@platform/contracts';
import type { Ref } from 'react';
import { Textarea } from '../components';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import './chat-input.css';

const REPLIES = ['chat.reply.onWay', 'chat.reply.fiveMinutes', 'chat.reply.where'] as const;

type Props = {
  // Read only 24 hours after the trip: the plate «Suhbat yopildi» stands in its place (docs/129).
  readonly hidden: boolean;
  readonly form: Ref<HTMLFormElement>;
  readonly text: string;
  readonly onText: (text: string) => void;
  readonly onSubmit: () => void;
  readonly onReply: (text: string) => void;
  readonly open: boolean;
  // The server hid a number just now: the grey line says it a little louder (docs/07).
  readonly warned: boolean;
};

// The bottom of a chat (mockup g60/2): ready answers in one tap, the grey line with a lock about
// hidden numbers, the field and the round «send».
export function ChatInput({ hidden, form, text, onText, onSubmit, onReply, open, warned }: Props) {
  const { t } = useI18n();
  if (hidden) return null;
  return (
    <form
      ref={form}
      className="chat-input"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="chat-replies">
        {REPLIES.map((key) => (
          <button
            key={key}
            type="button"
            className="chat-reply"
            disabled={!open}
            onClick={() => onReply(t(key))}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <p className={warned ? 'chat-lock chat-lock-warned' : 'chat-lock'}>
        <Icon name="locked" size={15} />
        {t('chat.hidden')}
      </p>
      <div className="chat-field">
        <Textarea
          aria-label={t('chat.placeholder')}
          rows={1}
          placeholder={t('chat.placeholder')}
          value={text}
          maxLength={MAX_CHAT_TEXT}
          onChange={(event) => onText(event.target.value)}
        />
        <button
          type="submit"
          className="chat-send"
          aria-label={t('chat.send')}
          disabled={!open || text.trim().length === 0}
        >
          <Icon name="send" size={22} />
        </button>
      </div>
    </form>
  );
}

// 24 hours after the trip (docs/129, mockup g60/6): the messages stay, writing ends; a forgotten
// thing goes through «Yordam».
export function ChatClosed() {
  const { t } = useI18n();
  return (
    <div className="chat-input chat-closed">
      <b>{t('chat.closed')}</b>
      <span>{t('chat.closedHint')}</span>
    </div>
  );
}
