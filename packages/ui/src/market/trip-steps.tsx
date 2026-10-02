import { COMMENT_MAX } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Button, List, Section, Textarea } from '../components';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';

type Step<T> = { readonly onBack: () => void; readonly onDone: (value: T) => void };

// "Mashinada ayol bor": a woman goes along, a relative without Telegram (docs/06).
export function WomanStep({ selected, onBack, onDone }: Step<boolean> & { readonly selected?: boolean }) {
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
      {...(selected === undefined ? {} : { selected })}
      onBack={onBack}
      onDone={onDone}
    />
  );
}

type CommentProps = Step<string> & {
  readonly initial: string;
  // Each letter goes to the draft: a closed app gives the comment back (docs/94 F3).
  readonly onType: (text: string) => void;
};

// The only text of a trip, and it may stay empty (docs/19: typing only when it is needed).
export function CommentStep({ initial, onType, onBack, onDone }: CommentProps) {
  const { t } = useI18n();
  const [text, setText] = useState(initial);
  return (
    <StepLayout icon="request" title={t('market.comment.title')} hint={t('market.comment.hint')}>
      <Screen onBack={onBack} />
      <List>
        <Section>
          <Textarea
            placeholder={t('market.comment.placeholder')}
            value={text}
            maxLength={COMMENT_MAX}
            onChange={(event) => {
              setText(event.target.value);
              onType(event.target.value);
            }}
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
