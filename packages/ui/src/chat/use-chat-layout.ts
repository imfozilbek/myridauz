import type { ChatMessage } from '@platform/contracts';
import { useEffect, useRef } from 'react';

// Closer than this to the end the person is reading the newest messages (docs/94 F10).
const NEAR_END_PX = 120;
const INPUT_HEIGHT = '--chat-input-height';

// The chat stays where the person reads (docs/94 F10, S5): the first messages show the end, a new
// one goes down only for someone at the end or for one's own; the input never covers the last.
export function useChatLayout(messages: readonly ChatMessage[], shown: boolean) {
  const chat = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLFormElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const nearEnd = useRef(true);
  const count = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const left = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      nearEnd.current = left <= NEAR_END_PX;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const before = count.current;
    count.current = messages.length;
    if (messages.length <= before) return;
    if (before === 0 || messages.at(-1)?.author === 'me' || nearEnd.current)
      end.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);
  // The input grows with the text and the warning: the messages keep room for all of it.
  useEffect(() => {
    const box = chat.current;
    const form = input.current;
    if (!shown || !box || !form || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => box.style.setProperty(INPUT_HEIGHT, `${form.offsetHeight}px`));
    observer.observe(form);
    return () => observer.disconnect();
  }, [shown]);
  return { chat, input, end };
}
