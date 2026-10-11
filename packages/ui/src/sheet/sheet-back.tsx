import { BackButton } from '../telegram/back-button';
import { useInTelegram } from '../telegram/in-telegram-context';

// «Назад» of Telegram closes an open sheet first, never the Mini App or the screen under it (docs/94
// F7, G77). Outside Telegram a swipe down or a tap on the shade closes it.
export function SheetBack({ onClose }: { readonly onClose: () => void }) {
  return useInTelegram() ? <BackButton overlay onClick={onClose} /> : null;
}
