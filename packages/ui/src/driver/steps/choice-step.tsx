import { useState } from 'react';
import { StepLayout } from '../../account/step-layout';
import { Cell, Input, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import type { IconName } from '../../icons';
import { BackButton } from '../../telegram/back-button';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';

export type Choice<T> = { readonly value: T; readonly label: string };

type ChoiceStepProps<T> = {
  readonly screen: string;
  readonly icon: IconName;
  readonly title: string;
  readonly choices: readonly Choice<T>[];
  readonly onBack: () => void;
  readonly onDone: (value: T) => void;
  // "Boshqa": the person types a name that is not in the list.
  readonly other?: { readonly toValue: (text: string) => T | null };
};

// One question, one tap (docs/19): choose, do not type. Typing only for "Boshqa".
export function ChoiceStep<T>({ screen, icon, title, choices, onBack, onDone, other }: ChoiceStepProps<T>) {
  useScreenView(screen);
  const { t } = useI18n();
  const [typing, setTyping] = useState(choices.length === 0);
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);
  const choose = (value: T) => {
    haptic.tap();
    onDone(value);
  };
  const submit = () => {
    const value = other?.toValue(text) ?? null;
    if (value === null) {
      haptic.error();
      return setInvalid(true);
    }
    choose(value);
  };
  return (
    <StepLayout icon={icon} title={title}>
      <BackButton onClick={typing && choices.length > 0 ? () => setTyping(false) : onBack} />
      <List>
        <Section>
          {typing ? (
            <Input
              placeholder={t('drivers.other.placeholder')}
              value={text}
              status={invalid ? 'error' : 'default'}
              onChange={(event) => {
                setText(event.target.value);
                setInvalid(false);
              }}
            />
          ) : (
            [
              ...choices.map((choice) => (
                <Cell key={String(choice.value)} onClick={() => choose(choice.value)}>
                  {choice.label}
                </Cell>
              )),
              other ? (
                <Cell key="other" onClick={() => setTyping(true)}>
                  {t('drivers.other')}
                </Cell>
              ) : null,
            ]
          )}
        </Section>
      </List>
      {typing ? <MainButton text={t('common.continue')} onClick={submit} /> : null}
    </StepLayout>
  );
}
