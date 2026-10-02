import { COMMENT_MAX } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Button, List, Section, Textarea } from '../components';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';

type Step<T> = { readonly onBack: () => void; readonly onDone: (value: T) => void };

// "Mashinada ayol bor": a woman goes along, a relative without Telegram (docs/06).
export function WomanStep({ onBack, onDone }: Step<boolean>) {
  const { t } = useI18n();
  return (
    <ChoiceStep
      screen="market.woman"
      icon="passengers"
      title={t('market.woman.title')}
      choices={[
        { value: true, label: t('market.woman.yes') },
        { value: false, label: t('market.woman.no') },
      ]}
      onBack={onBack}
      onDone={onDone}
    />
  );
}

// The only text of a trip, and it may stay empty (docs/19: typing only when it is needed).
export function CommentStep({ initial, onBack, onDone }: Step<string> & { readonly initial: string }) {
  const { t } = useI18n();
  const [text, setText] = useState(initial);
  return (
    <StepLayout icon="request" title={t('market.comment.title')} hint={t('market.comment.hint')}>
      <BackButton onClick={onBack} />
      <List>
        <Section>
          <Textarea
            placeholder={t('market.comment.placeholder')}
            value={text}
            maxLength={COMMENT_MAX}
            onChange={(event) => setText(event.target.value)}
          />
        </Section>
      </List>
      <div className="step-note">
        <Button mode="plain" size="m" stretched onClick={() => onDone('')}>
          {t('market.comment.skip')}
        </Button>
      </div>
      {text.trim() ? <MainButton text={t('common.continue')} onClick={() => onDone(text.trim())} /> : null}
    </StepLayout>
  );
}

// Seats from 1 to the seats of the car (docs/35); the car's own number is chosen in advance.
export function SeatsStep({
  max,
  initial,
  onBack,
  onDone,
}: Step<number> & { readonly max: number; readonly initial: number }) {
  const { t } = useI18n();
  const choices = Array.from({ length: max }, (_, index) => ({ value: index + 1, label: String(index + 1) }));
  return (
    <ChoiceStep
      screen="market.seats"
      icon="passengers"
      title={t('market.seats.title')}
      choices={choices}
      selected={Math.min(initial, max)}
      onBack={onBack}
      onDone={onDone}
    />
  );
}
