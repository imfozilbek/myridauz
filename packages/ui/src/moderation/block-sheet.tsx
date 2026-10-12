import { BLOCK_DAYS, type BlockInput } from '@platform/contracts';
import { useRef } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ChoiceRows } from '../sheet/choice-rows';
import { FormSheet } from '../sheet/form-sheet';
import { confirm } from '../telegram/feedback';

const FOREVER = 'forever';

type DaysProps = { readonly onBlock: (days: BlockInput['days']) => unknown };
type SheetProps = DaysProps & { readonly open: boolean; readonly onClose: () => void };

// «Bloklash» of a person, of an application or of a complaint: the days in a sheet over the screen,
// one tap blocks (G78 sheet 6).
export function BlockSheet({ open, onClose, onBlock }: SheetProps) {
  const { t } = useI18n();
  return (
    <FormSheet open={open} title={t('moderation.block.title')} onClose={onClose}>
      <BlockDays onBlock={onBlock} />
    </FormSheet>
  );
}

function BlockDays({ onBlock }: DaysProps) {
  useScreenView('moderation.block');
  const { t } = useI18n();
  // A second tap while the block goes never sends it twice.
  const running = useRef(false);
  // A block for good is asked first: one tap never closes someone's way by mistake (docs/65 B4).
  // A block for some days goes at once: it ends by itself.
  const pick = async (key: string) => {
    if (running.current) return;
    running.current = true;
    const days = BLOCK_DAYS.find((one) => String(one) === key) ?? null;
    try {
      const asked = days === null;
      if (!asked || (await confirm(t('moderation.block.foreverAsk'), t('complaints.blockForever'))))
        await onBlock(days);
    } finally {
      running.current = false;
    }
  };
  return (
    <ChoiceRows
      name="block"
      choices={[
        ...BLOCK_DAYS.map((days) => ({
          key: String(days),
          title: t('moderation.block.days', { days: String(days) }),
        })),
        { key: FOREVER, title: t('moderation.block.forever'), danger: true },
      ]}
      onPick={(key) => void pick(key)}
    />
  );
}
