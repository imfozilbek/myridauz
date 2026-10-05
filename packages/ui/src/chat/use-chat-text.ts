import { useEffect, useRef, useState } from 'react';
import { useDraft } from '../screen/draft';
import { haptic } from '../telegram/feedback';

const asText = (value: unknown) => (typeof value === 'string' ? value : null);

// What the person types in a chat (docs/94 C3, F3): kept on this phone as a draft of this chat;
// it goes away only when the chat sent the message back, a lost message keeps the text.
export function useChatText(chatKey: string, send: (text: string) => boolean, delivered: number) {
  const { restored, save, clear } = useDraft(`chat:${chatKey}`, asText);
  const [text, setText] = useState(restored ?? '');
  const sent = useRef<string | null>(null);
  useEffect(() => {
    if (text) save(text);
    else clear();
  }, [text, save, clear]);
  useEffect(() => {
    const value = sent.current;
    sent.current = null;
    // Typed more meanwhile: the new text stays.
    if (value !== null) setText((now) => (now.trim() === value ? '' : now));
  }, [delivered]);
  const submit = () => {
    const value = text.trim();
    if (value.length === 0 || !send(value)) return;
    haptic.tap();
    sent.current = value;
  };
  return { text, setText, submit };
}
