import { useCallsOn } from '../../call/calls-on';
import { useI18n } from '../../context/i18n-context';
import type { DockTool } from './dock-card';

// The call and the chat next to a person of a seat (docs/07: numbers hidden), the same on every card;
// without calls set up only the chat (G52, docs/112).
export function useTalkTools(call: () => void, talk: () => void, unread: boolean) {
  const { t } = useI18n();
  const callsOn = useCallsOn();
  const chat: DockTool = { icon: 'chat', label: t('chat.open'), dot: unread, onClick: talk };
  const phone: DockTool = { icon: 'phone', label: t('sheet.meet.call'), onClick: call };
  return { chat, phone: callsOn ? [phone] : [], tools: callsOn ? [phone, chat] : [chat] };
}
