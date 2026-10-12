import { MODERATION_REASONS, type ModerationReason } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { FormSheet } from '../sheet/form-sheet';
import { TickRows } from '../sheet/tick-rows';
import { MainButton } from '../telegram/bottom-button';

type TicksProps = {
  // The ticks live in the case: closing the sheet keeps them, so it asks nothing (G79 К10).
  readonly picked: readonly ModerationReason[];
  readonly onPick: (reasons: readonly ModerationReason[]) => void;
  readonly onDone: (reasons: ModerationReason[]) => void;
};

type SheetProps = TicksProps & { readonly open: boolean; readonly onClose: () => void };

// The moderator ticks one or more reasons in a sheet over the application (docs/04, G78 К2): the
// driver sees each one at its photo or field.
export function ReasonsSheet({ open, onClose, ...ticks }: SheetProps) {
  const { t } = useI18n();
  return (
    <FormSheet
      open={open}
      title={t('moderation.reason.title')}
      hint={t('moderation.reason.hint')}
      onClose={onClose}
    >
      <ReasonTicks {...ticks} />
    </FormSheet>
  );
}

function ReasonTicks({ picked, onPick, onDone }: TicksProps) {
  useScreenView('moderation.reason');
  const { t } = useI18n();
  const toggle = (reason: ModerationReason) =>
    onPick(picked.includes(reason) ? picked.filter((item) => item !== reason) : [...picked, reason]);
  // Sent in the order of the list, the same as in the bot.
  const send = () => onDone(MODERATION_REASONS.filter((reason) => picked.includes(reason)));
  return (
    <>
      <TickRows
        ticks={MODERATION_REASONS.map((reason) => ({ key: reason, title: t(`drivers.reason.${reason}`) }))}
        chosen={picked}
        onToggle={toggle}
      />
      {picked.length > 0 ? <MainButton text={t('moderation.reason.send')} onClick={send} /> : null}
    </>
  );
}
