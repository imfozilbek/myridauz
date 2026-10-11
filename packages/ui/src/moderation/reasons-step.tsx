import { MODERATION_REASONS, type ModerationReason } from '@platform/contracts';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Multiselectable, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';

type ReasonsStepProps = {
  // The ticks live in the case: «Назад» keeps them, so it asks nothing (G79 К10).
  readonly picked: readonly ModerationReason[];
  readonly onPick: (reasons: readonly ModerationReason[]) => void;
  readonly onBack: () => void;
  readonly onDone: (reasons: ModerationReason[]) => void;
};

// The moderator ticks one or more reasons (docs/04): the driver sees each one at its photo or field.
export function ReasonsStep({ picked, onPick, onBack, onDone }: ReasonsStepProps) {
  useScreenView('moderation.reason');
  const { t } = useI18n();
  const toggle = (reason: ModerationReason) => {
    haptic.select();
    onPick(picked.includes(reason) ? picked.filter((item) => item !== reason) : [...picked, reason]);
  };
  // Sent in the order of the list, the same as in the bot.
  const send = () => onDone(MODERATION_REASONS.filter((reason) => picked.includes(reason)));
  return (
    <StepLayout icon="applications" title={t('moderation.reason.title')} hint={t('moderation.reason.hint')}>
      <Screen onBack={onBack} />
      <List>
        <Section>
          {MODERATION_REASONS.map((reason) => (
            <Cell
              key={reason}
              Component="label"
              before={<Multiselectable checked={picked.includes(reason)} onChange={() => toggle(reason)} />}
            >
              {t(`drivers.reason.${reason}`)}
            </Cell>
          ))}
        </Section>
      </List>
      {picked.length > 0 ? <MainButton text={t('moderation.reason.send')} onClick={send} /> : null}
    </StepLayout>
  );
}
