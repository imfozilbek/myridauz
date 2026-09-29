import { chatServerEventSchema, type ChatMessage } from '@platform/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';

export type ChatState = 'connecting' | 'open' | 'failed';

// The live chat of a booking (docs/07): a ticket from the API, then a socket to the chat.
export function useChat(key: string) {
  const { chat } = useApiClients();
  const { track } = useAnalytics();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ChatState>('connecting');
  const [warning, setWarning] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let closed = false;
    setState('connecting');
    chat.socketUrl(key).then(
      (url) => {
        if (closed) return;
        const ws = new WebSocket(url);
        socket.current = ws;
        ws.addEventListener('open', () => setState('open'));
        ws.addEventListener('close', () => !closed && setState('failed'));
        ws.addEventListener('message', (event: MessageEvent<string>) => {
          const parsed = chatServerEventSchema.safeParse(JSON.parse(event.data));
          if (!parsed.success) return;
          const data = parsed.data;
          if (data.type === 'history') setMessages(data.messages);
          else if (data.type === 'message') setMessages((list) => [...list, data.message]);
          else setWarning(true);
        });
      },
      () => !closed && setState('failed'),
    );
    return () => {
      closed = true;
      socket.current?.close();
      socket.current = null;
    };
  }, [chat, key, attempt]);

  useEffect(() => track({ name: 'chat_open', screen: 'chat' }), [track]);

  const send = useCallback(
    (text: string) => {
      if (!socket.current || state !== 'open') return false;
      if (!messages.some((message) => message.author === 'me'))
        track({ name: 'chat_first_message', screen: 'chat' });
      setWarning(false);
      socket.current.send(JSON.stringify({ type: 'send', text }));
      return true;
    },
    [messages, state, track],
  );
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { messages, state, warning, send, retry };
}
