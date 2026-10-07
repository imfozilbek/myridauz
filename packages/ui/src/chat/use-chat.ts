import {
  chatServerEventSchema,
  type ChatClientEvent,
  type ChatMessage,
  type ChatServerEvent,
} from '@platform/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { reconnectDelay } from './reconnect';
import { useCallState } from './use-call-state';

export type ChatState = 'connecting' | 'open' | 'failed';

// The live chat of a booking (docs/07): a ticket from the API, then a socket to the chat.
export function useChat(key: string) {
  const { chat } = useApiClients();
  const { track } = useAnalytics();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // The history came: only then «no messages yet» may show (G41, docs/108).
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<ChatState>('connecting');
  const [warning, setWarning] = useState(false);
  // 24 hours after the trip the chat is read only (docs/129).
  const [canWrite, setCanWrite] = useState(true);
  // Own messages the chat sent back: what the person wrote is delivered (docs/94 C3).
  const [delivered, setDelivered] = useState(0);
  const calls = useCallState();
  const socket = useRef<WebSocket | null>(null);
  const [attempt, setAttempt] = useState(0);

  const handle = (data: ChatServerEvent) => {
    if (data.type === 'history') {
      setMessages(data.messages);
      setLoaded(true);
      calls.setCanCall(data.canCall);
      setCanWrite(data.canWrite);
    } else if (data.type === 'message') {
      setMessages((list) => [...list, data.message]);
      if (data.message.author === 'me') setDelivered((count) => count + 1);
    } else if (data.type === 'warning') setWarning(true);
    else calls.handle(data);
  };
  // A chat that was open and dropped reconnects by itself; a chat that never opened shows the error.
  const failures = useRef(0);
  const wasOpen = useRef(false);
  useEffect(() => {
    let closed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const lost = () => {
      if (closed) return;
      calls.lost();
      const delay = wasOpen.current ? reconnectDelay(failures.current) : null;
      failures.current += 1;
      if (delay === null) return setState('failed');
      setState('connecting');
      timer = setTimeout(() => setAttempt((value) => value + 1), delay);
    };
    setState('connecting');
    chat.socketUrl(key).then((url) => {
      if (closed) return;
      const ws = new WebSocket(url);
      socket.current = ws;
      ws.addEventListener('open', () => {
        failures.current = 0;
        wasOpen.current = true;
        setState('open');
      });
      ws.addEventListener('close', lost);
      ws.addEventListener('message', (event: MessageEvent<string>) => {
        const parsed = chatServerEventSchema.safeParse(JSON.parse(event.data));
        if (!parsed.success) return;
        handle(parsed.data);
      });
    }, lost);
    return () => {
      closed = true;
      clearTimeout(timer);
      socket.current?.close();
      socket.current = null;
    };
  }, [chat, key, attempt]);

  useEffect(() => {
    track({ name: 'chat_open', screen: 'chat' });
  }, [track]);

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
  const retry = useCallback(() => {
    failures.current = 0;
    setAttempt((value) => value + 1);
  }, []);
  // A step of a call on the same socket: the voice itself never goes here.
  const emit = useCallback((event: Exclude<ChatClientEvent, { type: 'send' }>) => {
    socket.current?.send(JSON.stringify(event));
  }, []);
  const { canCall, call, ended, onTrack, dismiss } = calls;
  const calling = { canCall, call, ended, emit, onTrack, dismiss };
  return { messages, loaded, state, warning, canWrite, delivered, send, retry, calling };
}

export type ChatCalling = ReturnType<typeof useChat>['calling'];
