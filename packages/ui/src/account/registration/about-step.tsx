import './registration.css';
import { nameSchema, type Gender } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, Input, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { IconTile } from '../../icon-tile';
import { Icon } from '../../icons';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { requestSignedContact } from '../../telegram/permissions';
import { StepLayout } from '../step-layout';

export type Answers = { readonly name: string; readonly gender: Gender | null };
export type Registration = { readonly firstName: string; readonly gender: Gender; readonly contact: string };

type AboutStepProps = {
  // Kept by the flow: back from here and forward again, the answers are still there (docs/94 B7).
  readonly answers: Answers;
  readonly onChange: (answers: Answers) => void;
  readonly onBack: () => void;
  // Both answers are there and the person asks Telegram for the number (analytics, docs/29).
  readonly onAnswered: () => void;
  // Resolves false when the server refused the registration.
  readonly onSend: (registration: Registration) => Promise<boolean>;
};

const GENDERS = ['male', 'female'] as const satisfies readonly Gender[];

// «Siz haqingizda» (G34): the name from Telegram, the gender in one tap, then the phone from
// Telegram itself: nothing to type for most people (docs/19, docs/10 question 33).
export function AboutStep({ answers, onChange, onBack, onAnswered, onSend }: AboutStepProps) {
  useScreenView('registration.about');
  const { t } = useI18n();
  const [edited, setEdited] = useState(false);
  const [failed, setFailed] = useState(false);
  const name = nameSchema.safeParse(answers.name);
  const { gender } = answers;
  // A name from Telegram may be emoji: it is shown wrong only after a touch or a choice.
  const nameWrong = !name.success && (edited || gender !== null);

  const choose = (value: Gender) => {
    haptic.select();
    onChange({ ...answers, gender: value });
  };
  const send = async (firstName: string, chosen: Gender) => {
    onAnswered();
    const contact = await requestSignedContact();
    const accepted = contact !== null && (await onSend({ firstName, gender: chosen, contact }));
    if (accepted) return;
    haptic.error();
    setFailed(true);
  };

  return (
    <StepLayout icon="profile" title={t('account.about.title')} hint={t('account.about.hint')}>
      <Screen onBack={onBack} />
      <List>
        <Section>
          <Input
            placeholder={t('account.name.placeholder')}
            value={answers.name}
            status={nameWrong ? 'error' : 'default'}
            onChange={(event) => {
              setEdited(true);
              onChange({ ...answers, name: event.target.value });
            }}
          />
        </Section>
        {nameWrong ? <Text className="step-error">{t('account.name.invalid')}</Text> : null}
        <Section>
          {GENDERS.map((value) => (
            <Cell
              key={value}
              before={<IconTile name={value} />}
              after={value === gender ? <Icon name="selected" /> : undefined}
              onClick={() => choose(value)}
            >
              {t(`account.gender.${value}`)}
            </Cell>
          ))}
        </Section>
      </List>
      {/* The fear of the first minute, said once in the whole path (docs/86 T13, G34). */}
      <div className="step-note about-hidden">
        <Icon name="hidden" size={18} />
        <Text>{t('account.about.hidden')}</Text>
      </div>
      {failed ? <Text className="step-error">{t('account.phone.denied')}</Text> : null}
      {name.success && gender ? (
        <MainButton text={t('account.phone.send')} onClick={() => send(name.data, gender)} />
      ) : null}
    </StepLayout>
  );
}
