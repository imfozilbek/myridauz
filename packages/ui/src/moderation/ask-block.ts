import type { useI18n } from '../context/i18n-context';
import { confirm } from '../telegram/feedback';

type Translate = ReturnType<typeof useI18n>['t'];

// A block for good is asked first: one tap never closes someone's way to Rida by mistake (docs/65 B4).
// A block for some days goes at once: it ends by itself.
export const allowBlock = (days: number | null, t: Translate): Promise<boolean> =>
  days === null
    ? confirm(t('moderation.block.foreverAsk'), t('complaints.blockForever'))
    : Promise.resolve(true);
