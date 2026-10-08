import { COMMENT_MAX } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Button, List, Section, Textarea } from '../components';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';

type Step<T> = { readonly onBack: () => void; readonly onDone: (value: T) => void };

type CommentProps = Step<string> & {
  readonly initial: string;
  // Each letter goes to the draft: a closed app gives the comment back (docs/94 F3).
  readonly onType: (text: string) => void;
  // The note of a booking has its own hint and limit (G63); a trip keeps its own.
  readonly hint?: string;
  readonly max?: number;
};

// The only text of a trip, and it may stay empty (docs/19: typing only when it is needed).
export function CommentStep({ initial, onType, onBack, onDone, hint, max = COMMENT_MAX }: CommentProps) {
  const { t } = useI18n();
  const [text, setText] = useState(initial);
  return (
    <StepLayout icon="request" title={t('market.comment.title')} hint={hint ?? t('market.comment.hint')}>
      <Screen onBack={onBack} />
      <List>
        <Section>
          <Textarea
            placeholder={t('market.comment.placeholder')}
            value={text}
            maxLength={max}
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
