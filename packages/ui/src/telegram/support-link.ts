import { useBrand } from '../context/brand-context';
import { openInTelegram } from './feedback';

// The support bot of the brand in Telegram (docs/50), its name from the brand (docs/22); text: the
// words ready in the field, the person only sends them (G75, mockup g75/4 B). One way for every
// button «Yordam», «Qoʻllab-quvvatlash» and «Hisobni toʻldirish» (G77).
export function useOpenSupport() {
  const { bots } = useBrand();
  return (text?: string) =>
    openInTelegram(`https://t.me/${bots.support}${text ? `?text=${encodeURIComponent(text)}` : ''}`);
}
