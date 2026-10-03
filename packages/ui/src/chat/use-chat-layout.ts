import type { ChatMessage } from '@platform/contracts';
import { useEffect, useRef } from 'react';

// Closer than this to the end the person is reading the newest messages (docs/94 F10).
const NEAR_END_PX = 120;
const INPUT_HEIGHT = '--chat-input-height';

// Was the person at the end before the new messages came? Read now, at their place on the screen: a
// scroll the browser has not reported yet still counts (G38, lesson №111).
function nearEnd(end: HTMLElement | null, added: number): boolean {
  let fresh = 0;
  let bubble = end?.previousElementSibling;
  for (let left = added; left > 0 && bubble; left -= 1, bubble = bubble.previousElementSibling)
    fresh += bubble.getBoundingClientRect().height;
  const below = document.documentElement.scrollHeight - fresh - window.scrollY - window.innerHeight;
  return below <= NEAR_END_PX;
}

// The chat stays where the person reads (docs/94 F10, S5): the first messages show the end, a new
// one goes down only for someone at the end or for one's own; the input never covers the last.
export function useChatLayout(messages: readonly ChatMessage[], shown: boolean) {
  const chat = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLFormElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const count = useRef(0);
  useEffect(() => {
    const before = count.current;
    count.current = messages.length;
    if (messages.length <= before) return;
    if (before === 0 || messages.at(-1)?.author === 'me' || nearEnd(end.current, messages.length - before))
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
